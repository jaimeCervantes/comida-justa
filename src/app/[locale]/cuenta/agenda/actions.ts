"use server";

// ↑ Primera sentencia del archivo, no cosmético: debajo de un import deja de ser directiva.

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { db } from "~/infra/dataAccess/db/connection";
import { createScheduleRepository } from "~/infra/dataAccess/schedule/factory";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";

/** La tienda de quien pide, o `null`. El gate de las tres acciones de esta pantalla. */
async function currentSellerId(): Promise<string | null> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) return null;

  const seller = await createSellerRepository().findByUserId(userId);

  return seller?.id ?? null;
}

/** Lo que llega de un `datetime-local`. Ilegible cuenta como ausente. */
function readInstant(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

export interface TimeOffActionState {
  error?: "invalid" | "no-store";
}

/**
 * Anota que el proveedor no atiende en un rango.
 *
 * Se guarda como **instantes** y no como fechas sueltas, que es lo que permite decir "el jueves solo
 * por la mañana" sin inventar otra tabla — y por eso el formulario pide fecha y hora.
 *
 * No se comprueba que la ausencia no pise una cita ya tomada: irse de vacaciones con gente citada es
 * un problema real, pero lo resuelve hablando con esa gente, no impidiéndole al proveedor anotar la
 * verdad. Lo que sí pasa es que esas horas dejan de ofrecerse a partir de ahora.
 */
export async function addTimeOff(
  _prev: TimeOffActionState,
  formData: FormData,
): Promise<TimeOffActionState> {
  const sellerId = await currentSellerId();

  if (!sellerId) return { error: "no-store" };

  const startsAt = readInstant(formData.get("from"));
  const endsAt = readInstant(formData.get("to"));

  if (!startsAt || !endsAt || endsAt <= startsAt) return { error: "invalid" };

  const reason = String(formData.get("reason") ?? "").trim() || null;

  await createScheduleRepository().addTimeOff(
    sellerId,
    { startsAt, endsAt },
    reason,
  );

  revalidatePath("/cuenta/agenda");

  return {};
}

export async function removeTimeOff(formData: FormData): Promise<void> {
  const sellerId = await currentSellerId();
  const id = String(formData.get("id") ?? "");

  if (!sellerId || !id) return;

  await createScheduleRepository().removeTimeOff(sellerId, id);

  revalidatePath("/cuenta/agenda");
}

export interface ScheduleActionState {
  saved?: boolean;
  error?: "invalid" | "no-store";
}

/** "09:30" → 570. Cualquier cosa ilegible cuenta como ausente. */
function toMinutes(value: FormDataEntryValue | null): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ""));

  if (!match) return null;

  const minutes = Number(match[1]) * 60 + Number(match[2]);

  return minutes >= 0 && minutes < 24 * 60 ? minutes : null;
}

/**
 * Guarda la semana tipo del proveedor, **reemplazándola entera**.
 *
 * Se borra y se vuelve a escribir en una transacción en vez de calcular qué franja cambió: el
 * formulario manda el horario completo —es lo que la persona está viendo— y un diff necesitaría una
 * identidad estable por franja que ni el formulario ni ella tienen. Es el mismo criterio que usa
 * `replaceMedia` al editar una publicación.
 */
export async function saveSchedule(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) return { error: "no-store" };

  const seller = await createSellerRepository().findByUserId(userId);

  if (!seller) return { error: "no-store" };

  const weekdays = formData.getAll("weekday");
  const froms = formData.getAll("from");
  const tos = formData.getAll("to");

  const rows: Array<{ weekday: number; from: number; to: number }> = [];

  for (let i = 0; i < weekdays.length; i++) {
    const weekday = Number(weekdays[i]);
    const from = toMinutes(froms[i]);
    const to = toMinutes(tos[i]);

    /* Una franja incompleta se salta —es una fila que la persona añadió y no llenó—, pero una con
       las dos horas al revés es un error suyo que hay que contarle. */
    if (from === null || to === null) continue;
    if (to <= from) return { error: "invalid" };
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;

    rows.push({ weekday, from, to });
  }

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`DELETE FROM provider_availability WHERE seller_id = ${seller.id}::uuid`,
    );

    for (const row of rows) {
      await tx.execute(sql`
        INSERT INTO provider_availability (seller_id, weekday, starts_at, ends_at)
        VALUES (
          ${seller.id}::uuid,
          ${row.weekday},
          make_time(${Math.floor(row.from / 60)}, ${row.from % 60}, 0),
          make_time(${Math.floor(row.to / 60)}, ${row.to % 60}, 0)
        )
      `);
    }
  });

  revalidatePath("/cuenta/agenda");

  return { saved: true };
}
