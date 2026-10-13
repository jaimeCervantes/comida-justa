import { describe, expect, it } from "vitest";
import { calendarDate } from "./lastPublished";
import {
  channelTurn,
  DAILY_OUTREACH_LIMIT,
  dailyPace,
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
  ])("con $llevas", ({ llevas, reached }) => {
    expect(dailyPace(llevas)).toEqual({
      count: llevas,
      limit: DAILY_OUTREACH_LIMIT,
      reached,
    });
  });

  it("el tope es de 10 mientras nadie lo mueva", () => {
    expect(DAILY_OUTREACH_LIMIT).toBe(10);
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
