import { describe, expect, it } from "vitest";
import { calendarDate } from "./lastPublished";
import {
  channelTurn,
  dailyPace,
  dueChannels,
  pauseStatus,
  suggestNextListing,
} from "./rhythm";

const MEXICO = "America/Mexico_City";
const NOW = new Date("2026-10-13T18:00:00-06:00");
const DAY = 86_400_000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

/** Las corridas de escritorio del slice 4 de `difusionEnGrupos.feature`. */
describe("a un grupo le toca según cada cuántos días acepta una publicación", () => {
  it.each([
    {
      cada: 7,
      cuando: daysAgo(3),
      turno: { due: false, inDays: 4 },
      porQue: "faltan 4 para cumplir los 7",
    },
    {
      cada: 7,
      cuando: daysAgo(7),
      turno: { due: true },
      porQue: "se cumplieron justo",
    },
    { cada: 7, cuando: null, turno: { due: true }, porQue: "nada que esperar" },
    {
      cada: 1,
      cuando: daysAgo(0),
      turno: { due: false, inDays: 1 },
      porQue: "una al día y ya hubo hoy",
    },
    {
      cada: 1,
      cuando: daysAgo(1),
      turno: { due: true },
      porQue: "una al día y la de ayer ya cuenta",
    },
    {
      cada: 0,
      cuando: daysAgo(0),
      turno: { due: true },
      porQue: "0 es sin límite",
    },
  ])("cada $cada: $porQue", ({ cada, cuando, turno }) => {
    expect(channelTurn(cada, cuando, NOW, MEXICO)).toEqual(turno);
  });
});

describe("el pan que toca es el que lleva más tiempo sin publicarse en ese grupo", () => {
  /** Un pan que no aparece en el historial nunca se publicó ahí. */
  function lastOf(history: Partial<Record<string, Date | null>>) {
    return (postId: string): Date | null => history[postId] ?? null;
  }

  it.each([
    {
      porQue: "lo que nunca se publicó va primero",
      orden: ["natural", "semillas", "arandanos"],
      historial: { natural: daysAgo(2), semillas: daysAgo(1), arandanos: null },
      toca: "arandanos",
    },
    {
      porQue: "si todo se publicó, el de hace más tiempo",
      orden: ["natural", "semillas"],
      historial: { natural: daysAgo(5), semillas: daysAgo(2) },
      toca: "natural",
    },
    {
      porQue: "empate: manda el orden de la publicación",
      orden: ["natural", "semillas"],
      historial: { natural: null, semillas: null },
      toca: "natural",
    },
  ])("$porQue", ({ orden, historial, toca }) => {
    expect(suggestNextListing(orden, lastOf(historial))).toBe(toca);
  });

  it("sin panes disponibles no hay qué sugerir", () => {
    expect(suggestNextListing([], () => null)).toBeNull();
  });
});

describe("el conteo del día avisa al llegar al tope", () => {
  it.each([
    { llevas: 3, reached: false },
    { llevas: 10, reached: true },
    { llevas: 12, reached: true },
  ])("con $llevas de 10", ({ llevas, reached }) => {
    expect(dailyPace(llevas, 10)).toEqual({
      count: llevas,
      limit: 10,
      reached,
    });
  });

  it("el tope es el que diga la configuración", () => {
    expect(dailyPace(12, 15)).toEqual({ count: 12, limit: 15, reached: false });
  });
});

/** La corrida de escritorio del slice 4.1 de `difusionEnGrupos.feature`. */
describe("la pausa cuenta desde lo último que se marcó, en cualquier grupo", () => {
  const MINUTE = 60_000;
  const minutesAgo = (minutes: number): Date =>
    new Date(NOW.getTime() - minutes * MINUTE);

  it.each([
    {
      cuando: "hace un momento",
      ultima: minutesAgo(0),
      pausa: 10,
      queda: { waiting: true, minutesSince: 0, minutesLeft: 10 },
    },
    {
      cuando: "hace 4 minutos",
      ultima: minutesAgo(4),
      pausa: 10,
      queda: { waiting: true, minutesSince: 4, minutesLeft: 6 },
    },
    {
      cuando: "hace 9 minutos",
      ultima: minutesAgo(9),
      pausa: 10,
      queda: { waiting: true, minutesSince: 9, minutesLeft: 1 },
    },
    {
      cuando: "hace 10 minutos: ya pasó la pausa",
      ultima: minutesAgo(10),
      pausa: 10,
      queda: { waiting: false },
    },
    {
      cuando: "nunca: no hay de qué descansar",
      ultima: null,
      pausa: 10,
      queda: { waiting: false },
    },
    {
      cuando: "con la pausa apagada",
      ultima: minutesAgo(0),
      pausa: 0,
      queda: { waiting: false },
    },
  ])("$cuando", ({ ultima, pausa, queda }) => {
    expect(pauseStatus(ultima, NOW, pausa)).toEqual(queda);
  });

  // 4 minutos y 59 segundos son 4 minutos: no se redondea hacia arriba lo que falta de espera.
  it("cuenta minutos enteros ya transcurridos", () => {
    expect(
      pauseStatus(new Date(NOW.getTime() - 4 * MINUTE - 59_000), NOW, 10),
    ).toEqual({ waiting: true, minutesSince: 4, minutesLeft: 6 });
  });

  // La hora de lo marcado la pone la base; un reloj de servidor atrasado no da «hace −1 minutos».
  it("un reloj desfasado no da minutos negativos", () => {
    expect(pauseStatus(new Date(NOW.getTime() + 30_000), NOW, 10)).toEqual({
      waiting: true,
      minutesSince: 0,
      minutesLeft: 10,
    });
  });
});

describe("calendarDate", () => {
  // 23:50 en México ya es el día siguiente en UTC: la fecha que cuenta es la de México.
  it("da la fecha de México, no la de UTC", () => {
    expect(calendarDate(new Date("2026-10-13T05:50:00Z"), MEXICO)).toBe(
      "2026-10-12",
    );
    expect(calendarDate(new Date("2026-10-13T06:10:00Z"), MEXICO)).toBe(
      "2026-10-13",
    );
  });
});

/** El resumen de arriba del slice 7: «Hoy les toca a 2 de 3 grupos». */
describe("a cuántos grupos les toca hoy", () => {
  it("cuenta los que ya les toca entre todos, de los dos tipos", () => {
    expect(
      dueChannels([{ due: false, inDays: 4 }, { due: true }, { due: true }]),
    ).toEqual({ due: 2, total: 3 });
  });

  it("sin grupos no hay nada que contar", () => {
    expect(dueChannels([])).toEqual({ due: 0, total: 0 });
  });
});
