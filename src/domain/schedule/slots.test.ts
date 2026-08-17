import { describe, expect, it } from "vitest";
import {
  chop,
  expandWeeklyHours,
  freeSlots,
  type Interval,
  overlaps,
  subtract,
} from "./slots";

const at = (iso: string) => new Date(iso);
const span = (from: string, to: string): Interval => ({
  startsAt: at(from),
  endsAt: at(to),
});
/** Para leer un resultado de un vistazo: solo las horas. */
const hours = (slots: Interval[]) =>
  slots.map(
    (s) =>
      `${s.startsAt.toISOString().slice(11, 16)}-${s.endsAt.toISOString().slice(11, 16)}`,
  );

const MANANA = span("2027-09-01T09:00:00Z", "2027-09-01T14:00:00Z");

describe("overlaps", () => {
  it("dos tramos que se pisan", () => {
    expect(
      overlaps(MANANA, span("2027-09-01T13:00:00Z", "2027-09-01T15:00:00Z")),
    ).toBe(true);
  });

  /* Con tramos medio abiertos, tocarse por el extremo NO es pisarse: es lo que permite que una cita
     de 10:00 vaya justo detrás de una que termina a las 10:00. */
  it("tocarse por el extremo no es pisarse", () => {
    expect(
      overlaps(MANANA, span("2027-09-01T14:00:00Z", "2027-09-01T15:00:00Z")),
    ).toBe(false);
  });
});

describe("subtract", () => {
  /* El caso que se olvida: una cita en mitad de la jornada no la acorta, LA PARTE EN DOS. Una resta
     que devolviera un solo tramo perdería la tarde entera. */
  it("una cita en medio parte la jornada en dos", () => {
    const trozos = subtract(
      MANANA,
      span("2027-09-01T11:00:00Z", "2027-09-01T12:00:00Z"),
    );

    expect(hours(trozos)).toEqual(["09:00-11:00", "12:00-14:00"]);
  });

  it("una cita al principio solo recorta por delante", () => {
    expect(
      hours(
        subtract(MANANA, span("2027-09-01T09:00:00Z", "2027-09-01T10:00:00Z")),
      ),
    ).toEqual(["10:00-14:00"]);
  });

  it("una ausencia que cubre el día entero no deja nada", () => {
    expect(
      subtract(MANANA, span("2027-09-01T08:00:00Z", "2027-09-01T18:00:00Z")),
    ).toEqual([]);
  });

  it("lo que no se pisa se devuelve intacto", () => {
    expect(
      hours(
        subtract(MANANA, span("2027-09-01T16:00:00Z", "2027-09-01T17:00:00Z")),
      ),
    ).toEqual(["09:00-14:00"]);
  });
});

describe("chop", () => {
  it("parte en huecos consecutivos", () => {
    expect(
      hours(chop(span("2027-09-01T09:00:00Z", "2027-09-01T10:30:00Z"), 30)),
    ).toEqual(["09:00-09:30", "09:30-10:00", "10:00-10:30"]);
  });

  /* Media hora libre no es un hueco para una consulta de 45 minutos: ofrecerla sería citar a
     alguien para echarlo a medias. */
  it("lo que sobra al final se tira", () => {
    expect(
      hours(chop(span("2027-09-01T09:00:00Z", "2027-09-01T10:00:00Z"), 45)),
    ).toEqual(["09:00-09:45"]);
  });

  it("un tramo más corto que la duración no da ningún hueco", () => {
    expect(
      chop(span("2027-09-01T09:00:00Z", "2027-09-01T09:30:00Z"), 45),
    ).toEqual([]);
  });
});

describe("freeSlots", () => {
  const ayer = at("2027-08-31T00:00:00Z");

  it("una jornada limpia se parte entera", () => {
    const slots = freeSlots({
      working: [span("2027-09-01T09:00:00Z", "2027-09-01T11:00:00Z")],
      busy: [],
      durationMinutes: 60,
      now: ayer,
    });

    expect(hours(slots)).toEqual(["09:00-10:00", "10:00-11:00"]);
  });

  /**
   * El orden importa, y este es el caso que lo demuestra.
   *
   * Se resta ANTES de partir. Al revés —partir la jornada entera y descartar los huecos que
   * chocan— una cita de 9:15 a 9:45 inutilizaría los huecos de 9:00 y de 9:30, cuando de 9:45 a
   * 10:30 cabe uno perfectamente.
   */
  it("restar antes de partir aprovecha lo que queda entre citas", () => {
    const slots = freeSlots({
      working: [span("2027-09-01T09:00:00Z", "2027-09-01T11:00:00Z")],
      busy: [span("2027-09-01T09:15:00Z", "2027-09-01T09:45:00Z")],
      durationMinutes: 45,
      now: ayer,
    });

    expect(hours(slots)).toEqual(["09:45-10:30"]);
  });

  it("las vacaciones y las citas se restan igual", () => {
    const slots = freeSlots({
      working: [span("2027-09-01T09:00:00Z", "2027-09-01T13:00:00Z")],
      busy: [
        span("2027-09-01T09:00:00Z", "2027-09-01T10:00:00Z"),
        span("2027-09-01T11:00:00Z", "2027-09-01T12:00:00Z"),
      ],
      durationMinutes: 60,
      now: ayer,
    });

    expect(hours(slots)).toEqual(["10:00-11:00", "12:00-13:00"]);
  });

  /* Un hueco que ya empezó no se ofrece: citar a alguien a las 9:00 a las 9:30 no tiene sentido. */
  it("lo que ya pasó no se ofrece", () => {
    const slots = freeSlots({
      working: [span("2027-09-01T09:00:00Z", "2027-09-01T12:00:00Z")],
      busy: [],
      durationMinutes: 60,
      now: at("2027-09-01T10:30:00Z"),
    });

    expect(hours(slots)).toEqual(["11:00-12:00"]);
  });

  it("salen en orden aunque las jornadas lleguen desordenadas", () => {
    const slots = freeSlots({
      working: [
        span("2027-09-01T16:00:00Z", "2027-09-01T17:00:00Z"),
        span("2027-09-01T09:00:00Z", "2027-09-01T10:00:00Z"),
      ],
      busy: [],
      durationMinutes: 60,
      now: ayer,
    });

    expect(hours(slots)).toEqual(["09:00-10:00", "16:00-17:00"]);
  });

  it("sin horario no hay huecos", () => {
    expect(
      freeSlots({ working: [], busy: [], durationMinutes: 30, now: ayer }),
    ).toEqual([]);
  });
});

describe("expandWeeklyHours", () => {
  /* Córdoba, Veracruz: UTC−6. Las 9:00 locales son las 15:00 UTC. */
  const CORDOBA = -360;

  it("repite la franja en cada día que toca", () => {
    // Del miércoles 1 al martes 7 de septiembre de 2027.
    const ventana = span("2027-09-01T00:00:00Z", "2027-09-08T00:00:00Z");

    const tramos = expandWeeklyHours(
      [{ weekday: 3, startsMinutes: 9 * 60, endsMinutes: 14 * 60 }],
      ventana,
      CORDOBA,
    );

    // Solo los miércoles: el 1 y el 8 —pero el 8 cae fuera de la ventana—.
    expect(tramos).toHaveLength(1);
    expect(tramos[0].startsAt.toISOString()).toBe("2027-09-01T15:00:00.000Z");
    expect(tramos[0].endsAt.toISOString()).toBe("2027-09-01T20:00:00.000Z");
  });

  it("una franja que no cae en la ventana no se expande", () => {
    const tramos = expandWeeklyHours(
      [{ weekday: 0, startsMinutes: 9 * 60, endsMinutes: 14 * 60 }],
      span("2027-09-01T00:00:00Z", "2027-09-03T00:00:00Z"),
      CORDOBA,
    );

    expect(tramos).toEqual([]);
  });

  /* La jornada que asoma por el borde se recorta en vez de desbordarse: sin esto, se ofrecerían
     huecos fuera de la ventana que se está mirando. */
  it("recorta lo que asoma por el borde de la ventana", () => {
    const tramos = expandWeeklyHours(
      [{ weekday: 3, startsMinutes: 9 * 60, endsMinutes: 14 * 60 }],
      span("2027-09-01T16:00:00Z", "2027-09-01T18:00:00Z"),
      CORDOBA,
    );

    expect(tramos).toHaveLength(1);
    expect(tramos[0].startsAt.toISOString()).toBe("2027-09-01T16:00:00.000Z");
    expect(tramos[0].endsAt.toISOString()).toBe("2027-09-01T18:00:00.000Z");
  });
});

describe("el recorrido completo", () => {
  /**
   * La masajista de Córdoba: atiende los miércoles de 9 a 14, tiene una cita a las 11 y se toma
   * libre la tarde. Un masaje dura una hora.
   */
  it("horario menos ausencias menos citas, partido en huecos", () => {
    const CORDOBA = -360;
    const ventana = span("2027-09-01T00:00:00Z", "2027-09-02T00:00:00Z");

    const working = expandWeeklyHours(
      [{ weekday: 3, startsMinutes: 9 * 60, endsMinutes: 14 * 60 }],
      ventana,
      CORDOBA,
    );

    const slots = freeSlots({
      working,
      busy: [
        // La cita ya tomada: 11:00 local = 17:00 UTC.
        span("2027-09-01T17:00:00Z", "2027-09-01T18:00:00Z"),
        // Se tomó libre de 13:00 local en adelante.
        span("2027-09-01T19:00:00Z", "2027-09-01T23:00:00Z"),
      ],
      durationMinutes: 60,
      now: at("2027-08-30T00:00:00Z"),
    });

    // Quedan 9-10, 10-11 y 12-13 locales → 15, 16 y 18 UTC.
    expect(hours(slots)).toEqual(["15:00-16:00", "16:00-17:00", "18:00-19:00"]);
  });
});
