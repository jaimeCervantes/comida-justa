import {
  expandWeeklyHours,
  freeSlots,
  type Interval,
  type WeeklyHours,
} from "~/domain/schedule/slots";

export interface IScheduleRepository {
  findWeeklyHours(sellerId: string): Promise<WeeklyHours[]>;
  findBusy(sellerId: string, window: Interval): Promise<Interval[]>;
  book(request: {
    sellerId: string;
    buyerId: string;
    postId: string;
    title: string;
    unitPrice: number;
    during: Interval;
  }): Promise<
    { booked: true; orderId: string } | { booked: false; reason: string }
  >;
}

export type FreeSlotsQuery = {
  sellerId: string;
  durationMinutes: number;
  window: Interval;
  offsetMinutes: number;
  now?: Date;
};

export type BookQuery = {
  sellerId: string;
  buyerId: string;
  postId: string;
  title: string;
  unitPrice: number;
  during: Interval;
  durationMinutes: number;
  offsetMinutes: number;
  now?: Date;
};

export type BookOutcome =
  | { booked: true; orderId: string }
  | { booked: false; reason: "slot-taken" | "not-offered" };

/**
 * Ver los huecos de un proveedor y quedarse con uno.
 *
 * El cálculo vive en el dominio (`freeSlots`); esto solo va a buscar los tres datos que necesita y
 * se los da. Es la frontera a propósito: la aritmética de un calendario se prueba sin base, y las
 * consultas se prueban contra una.
 */
export default class BookAppointmentUseCase {
  constructor(private readonly repository: IScheduleRepository) {}

  async freeSlots({
    sellerId,
    durationMinutes,
    window,
    offsetMinutes,
    now,
  }: FreeSlotsQuery): Promise<Interval[]> {
    const [hours, busy] = await Promise.all([
      this.repository.findWeeklyHours(sellerId),
      this.repository.findBusy(sellerId, window),
    ]);

    return freeSlots({
      working: expandWeeklyHours(hours, window, offsetMinutes),
      busy,
      durationMinutes,
      now,
    });
  }

  /**
   * Agenda una cita.
   *
   * Comprueba **antes** que el hueco pedido sea uno de los que se ofrecen, y aun así deja que la
   * base tenga la última palabra. Las dos comprobaciones sirven para cosas distintas y ninguna
   * sobra:
   *
   * - La de aquí atrapa a quien pide una hora que **nunca** se ofreció —fuera del horario, en mitad
   *   de las vacaciones, a las 3 de la mañana— y le contesta con sentido.
   * - La de la base atrapa a quien pide una hora que **sí** se ofrecía y dejó de estarlo entre que
   *   la vio y pulsó. Esa carrera no la puede ganar ninguna comprobación previa.
   */
  async book({
    during,
    durationMinutes,
    offsetMinutes,
    window,
    now,
    ...request
  }: BookQuery & { window?: Interval }): Promise<BookOutcome> {
    const offered = await this.freeSlots({
      sellerId: request.sellerId,
      durationMinutes,
      offsetMinutes,
      now,
      window: window ?? during,
    });

    const isOffered = offered.some(
      (slot) =>
        slot.startsAt.getTime() === during.startsAt.getTime() &&
        slot.endsAt.getTime() === during.endsAt.getTime(),
    );

    if (!isOffered) return { booked: false, reason: "not-offered" };

    const result = await this.repository.book({ ...request, during });

    return result.booked
      ? { booked: true, orderId: result.orderId }
      : { booked: false, reason: "slot-taken" };
  }
}
