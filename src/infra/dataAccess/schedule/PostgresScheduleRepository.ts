import { sql } from "drizzle-orm";
import type { Interval, WeeklyHours } from "~/domain/schedule/slots";
import { db } from "~/infra/dataAccess/db/connection";

/** El choque contra la restricción de exclusión: alguien se quedó con el hueco primero. */
export const SLOT_TAKEN = "slot-taken";

export type BookingRequest = {
  sellerId: string;
  buyerId: string;
  postId: string;
  title: string;
  unitPrice: number;
  during: Interval;
};

export type TimeOff = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
};

export type BookingResult =
  | { booked: true; orderId: string }
  | { booked: false; reason: typeof SLOT_TAKEN };

/** Postgres marca la violación de una restricción de exclusión con este código. */
const EXCLUSION_VIOLATION = "23P01";

/**
 * ¿Este error es "alguien se te adelantó"?
 *
 * Mira **tres** señales y baja por `cause`, y las tres hacen falta: Drizzle envuelve el error de
 * `pg` en uno suyo cuya `message` es "Failed query: INSERT…", así que ni el `code` ni el texto del
 * driver están donde uno los busca. El que sí sobrevive intacto es `constraint`.
 *
 * Confundir esto con un error cualquiera sería contestarle "algo salió mal" a alguien a quien
 * simplemente le ganaron el hueco por medio segundo.
 */
function isSlotTaken(error: unknown): boolean {
  for (let current = error; current; current = (current as Error).cause) {
    const candidate = current as { code?: string; constraint?: string };

    if (candidate.code === EXCLUSION_VIOLATION) return true;
    if (candidate.constraint?.includes("no_overlapping_appointments")) {
      return true;
    }
    if (String((current as Error).message ?? "").includes("23P01")) return true;
  }

  return false;
}

export class PostgresScheduleRepository {
  /** La semana tipo del proveedor: cuándo atiende. */
  async findWeeklyHours(sellerId: string): Promise<WeeklyHours[]> {
    const raw = await db.execute(sql`
      SELECT weekday,
             EXTRACT(HOUR FROM starts_at) * 60 + EXTRACT(MINUTE FROM starts_at) AS starts,
             EXTRACT(HOUR FROM ends_at)   * 60 + EXTRACT(MINUTE FROM ends_at)   AS ends
      FROM provider_availability
      WHERE seller_id = ${sellerId}::uuid
      ORDER BY weekday, starts_at
    `);

    return (raw.rows as unknown as Array<Record<string, string>>).map(
      (row) => ({
        weekday: Number(row.weekday),
        startsMinutes: Number(row.starts),
        endsMinutes: Number(row.ends),
      }),
    );
  }

  /**
   * Todo lo que NO está libre en la ventana: sus ausencias y sus citas ya tomadas.
   *
   * Vienen juntas y sin distinguirse a propósito. Para calcular huecos da exactamente igual si una
   * hora está ocupada porque el proveedor se fue de vacaciones o porque ya citó a alguien: en las
   * dos no se puede citar. Devolverlas separadas obligaría a quien llama a volver a juntarlas.
   *
   * Las canceladas no cuentan, igual que en la restricción de exclusión — y por el mismo motivo:
   * cancelar libera el hueco.
   */
  async findBusy(sellerId: string, window: Interval): Promise<Interval[]> {
    const raw = await db.execute(sql`
      SELECT starts_at, ends_at
      FROM provider_time_off
      WHERE seller_id = ${sellerId}::uuid
        AND starts_at < ${window.endsAt} AND ends_at > ${window.startsAt}

      UNION ALL

      SELECT lower(during), upper(during)
      FROM customer_orders
      WHERE seller_id = ${sellerId}::uuid
        AND during IS NOT NULL
        AND status <> 'CANCELLED'
        AND during && tstzrange(${window.startsAt}, ${window.endsAt}, '[)')
    `);

    return (
      raw.rows as unknown as Array<{ starts_at: string; ends_at: string }>
    ).map((row) => ({
      startsAt: new Date(row.starts_at),
      endsAt: new Date(row.ends_at),
    }));
  }

  /**
   * Las ausencias declaradas, de hoy en adelante.
   *
   * Las pasadas no se listan: una vacación de hace dos años no es algo que nadie vaya a querer
   * editar, y enseñarlas convertiría la pantalla en un archivo histórico. Siguen en la tabla —
   * borrarlas sería tocar datos que no molestan a nadie.
   */
  async findUpcomingTimeOff(sellerId: string): Promise<TimeOff[]> {
    const raw = await db.execute(sql`
      SELECT id, starts_at, ends_at, reason
      FROM provider_time_off
      WHERE seller_id = ${sellerId}::uuid AND ends_at >= now()
      ORDER BY starts_at
    `);

    return (
      raw.rows as unknown as Array<{
        id: string;
        starts_at: string;
        ends_at: string;
        reason: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      startsAt: new Date(row.starts_at),
      endsAt: new Date(row.ends_at),
      reason: row.reason,
    }));
  }

  async addTimeOff(
    sellerId: string,
    period: Interval,
    reason: string | null,
  ): Promise<void> {
    await db.execute(sql`
      INSERT INTO provider_time_off (seller_id, starts_at, ends_at, reason)
      VALUES (${sellerId}::uuid, ${period.startsAt}, ${period.endsAt}, ${reason})
    `);
  }

  /**
   * Quita una ausencia. Se comprueba el dueño en el `WHERE`, no antes: así no existe el instante
   * entre comprobar y borrar en el que otra petición podría cambiar las cosas.
   */
  async removeTimeOff(sellerId: string, id: string): Promise<void> {
    await db.execute(sql`
      DELETE FROM provider_time_off
      WHERE id = ${id}::uuid AND seller_id = ${sellerId}::uuid
    `);
  }

  /**
   * Guarda la cita como un pedido de un solo renglón.
   *
   * **No comprueba antes si el hueco está libre**: esa comprobación es la que pierde la carrera.
   * Se intenta escribir y se deja que la restricción de exclusión decida — si choca, Postgres
   * levanta un `23P01` y aquí se traduce a "alguien se te adelantó", que es exactamente lo que pasó.
   *
   * Va en transacción porque un pedido sin su renglón no es un pedido: sería una cita sin decir de
   * qué.
   */
  async book(request: BookingRequest): Promise<BookingResult> {
    try {
      const orderId = await db.transaction(async (tx) => {
        const inserted = await tx.execute(sql`
          INSERT INTO customer_orders (checkout_id, seller_id, user_id, during)
          VALUES (
            gen_random_uuid(),
            ${request.sellerId}::uuid,
            ${request.buyerId},
            tstzrange(${request.during.startsAt}, ${request.during.endsAt}, '[)')
          )
          RETURNING id
        `);

        const id = (inserted.rows[0] as { id: string }).id;

        await tx.execute(sql`
          INSERT INTO customer_order_items (order_id, post_id, title, unit_price, quantity)
          VALUES (${id}::uuid, ${request.postId}, ${request.title}, ${request.unitPrice}, 1)
        `);

        return id;
      });

      return { booked: true, orderId };
    } catch (error) {
      if (isSlotTaken(error)) return { booked: false, reason: SLOT_TAKEN };
      throw error;
    }
  }
}
