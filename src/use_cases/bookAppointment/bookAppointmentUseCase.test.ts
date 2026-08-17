import { describe, expect, it, vi } from "vitest";
import type { Interval } from "~/domain/schedule/slots";
import BookAppointmentUseCase, {
  type IScheduleRepository,
} from "./bookAppointmentUseCase";

const CORDOBA = -360;
const SELLER = "seller-1";

/** Miércoles 1 de septiembre de 2027. Atiende de 9 a 12 local = 15 a 18 UTC. */
const WINDOW: Interval = {
  startsAt: new Date("2027-09-01T00:00:00Z"),
  endsAt: new Date("2027-09-02T00:00:00Z"),
};
const NOW = new Date("2027-08-30T00:00:00Z");
const A_LAS_15: Interval = {
  startsAt: new Date("2027-09-01T15:00:00Z"),
  endsAt: new Date("2027-09-01T16:00:00Z"),
};

function build(options: { busy?: Interval[]; booked?: boolean } = {}) {
  const repository: IScheduleRepository = {
    findWeeklyHours: vi.fn(async () => [
      { weekday: 3, startsMinutes: 9 * 60, endsMinutes: 12 * 60 },
    ]),
    findBusy: vi.fn(async () => options.busy ?? []),
    book: vi.fn(async () =>
      options.booked === false
        ? ({ booked: false, reason: "slot-taken" } as const)
        : ({ booked: true, orderId: "order-1" } as const),
    ),
  };

  return { useCase: new BookAppointmentUseCase(repository), repository };
}

const peticion = {
  sellerId: SELLER,
  buyerId: "user-1",
  postId: "post-1",
  title: "Masaje de espalda",
  unitPrice: 600,
  durationMinutes: 60,
  offsetMinutes: CORDOBA,
  window: WINDOW,
  now: NOW,
};

describe("BookAppointmentUseCase", () => {
  it("ofrece los huecos de la jornada, en hora universal", async () => {
    const { useCase } = build();

    const slots = await useCase.freeSlots({
      sellerId: SELLER,
      durationMinutes: 60,
      window: WINDOW,
      offsetMinutes: CORDOBA,
      now: NOW,
    });

    expect(slots.map((s) => s.startsAt.toISOString())).toEqual([
      "2027-09-01T15:00:00.000Z",
      "2027-09-01T16:00:00.000Z",
      "2027-09-01T17:00:00.000Z",
    ]);
  });

  it("agenda un hueco de los ofrecidos", async () => {
    const { useCase, repository } = build();

    expect(await useCase.book({ ...peticion, during: A_LAS_15 })).toEqual({
      booked: true,
      orderId: "order-1",
    });
    expect(repository.book).toHaveBeenCalledOnce();
  });

  /**
   * Las dos guardas sirven para cosas distintas y ninguna sobra.
   *
   * Ésta atrapa a quien pide una hora que **nunca** se ofreció, y se resuelve sin tocar la base.
   */
  it("una hora que nunca se ofreció se rechaza sin intentar escribir", async () => {
    const { useCase, repository } = build();

    const result = await useCase.book({
      ...peticion,
      during: {
        startsAt: new Date("2027-09-01T03:00:00Z"),
        endsAt: new Date("2027-09-01T04:00:00Z"),
      },
    });

    expect(result).toEqual({ booked: false, reason: "not-offered" });
    expect(repository.book).not.toHaveBeenCalled();
  });

  /* Y ésta atrapa a quien pidió una hora que SÍ se ofrecía y dejó de estarlo entre que la vio y
     pulsó. Esa carrera no la puede ganar ninguna comprobación previa. */
  it("si la base dice que ya no está, se contesta que se lo ganaron", async () => {
    const { useCase } = build({ booked: false });

    expect(await useCase.book({ ...peticion, during: A_LAS_15 })).toEqual({
      booked: false,
      reason: "slot-taken",
    });
  });

  it("lo ocupado desaparece de los huecos", async () => {
    const { useCase } = build({ busy: [A_LAS_15] });

    const slots = await useCase.freeSlots({
      sellerId: SELLER,
      durationMinutes: 60,
      window: WINDOW,
      offsetMinutes: CORDOBA,
      now: NOW,
    });

    expect(slots.map((s) => s.startsAt.toISOString().slice(11, 16))).toEqual([
      "16:00",
      "17:00",
    ]);
  });
});
