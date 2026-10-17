import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import {
  dailyPaceMessage,
  dueChannelsMessage,
  pauseMessage,
} from "./paceMessages";

/** El catálogo de verdad: si alguien cambia una frase, esta prueba lo dice. */
const t = createTranslator({
  locale: "es",
  messages: es,
  namespace: "outreach",
});

/** Las frases exactas de las corridas de escritorio de los slices 4 y 4.1. */
describe("los avisos del ritmo", () => {
  it.each([
    {
      cuando: "hace un momento",
      pausa: { waiting: true as const, minutesSince: 0, minutesLeft: 10 },
      seLee:
        "Acabas de publicar: espera unos 10 minutos antes de la siguiente.",
    },
    {
      cuando: "hace 4 minutos",
      pausa: { waiting: true as const, minutesSince: 4, minutesLeft: 6 },
      seLee:
        "Tu última publicación fue hace 4 minutos: espera unos 6 minutos más antes de la siguiente.",
    },
    {
      cuando: "hace 9 minutos",
      pausa: { waiting: true as const, minutesSince: 9, minutesLeft: 1 },
      seLee:
        "Tu última publicación fue hace 9 minutos: espera un minuto más antes de la siguiente.",
    },
  ])("la pausa $cuando", ({ pausa, seLee }) => {
    expect(pauseMessage(t, pausa)).toBe(seLee);
  });

  it("sin pausa que respetar no hay aviso", () => {
    expect(pauseMessage(t, { waiting: false })).toBeNull();
  });

  it.each([
    {
      llevas: 3,
      seLee: "Hoy llevas 3 de 10 publicaciones en grupos.",
    },
    {
      llevas: 10,
      seLee:
        "Hoy ya llevas 10 de 10. Más publicaciones el mismo día se parecen a spam: mejor sigue mañana.",
    },
    {
      llevas: 12,
      seLee:
        "Hoy ya llevas 12 de 10. Más publicaciones el mismo día se parecen a spam: mejor sigue mañana.",
    },
  ])("el conteo con $llevas de 10", ({ llevas, seLee }) => {
    expect(
      dailyPaceMessage(t, { count: llevas, limit: 10, reached: llevas >= 10 }),
    ).toBe(seLee);
  });
});

/** El resumen de arriba del slice 7. */
describe("a cuántos grupos les toca hoy", () => {
  it.each([
    { due: 2, total: 3, seLee: "Hoy les toca a 2 de 3 grupos." },
    { due: 1, total: 3, seLee: "Hoy le toca a 1 de 3 grupos." },
    { due: 0, total: 2, seLee: "Hoy no le toca a ninguno de tus 2 grupos." },
    { due: 1, total: 1, seLee: "Hoy le toca a 1 de 1 grupo." },
  ])("$due de $total", ({ due, total, seLee }) => {
    expect(dueChannelsMessage(t, { due, total })).toBe(seLee);
  });

  it("sin grupos no dice nada: lo dice cada sección, con su enlace para darlos de alta", () => {
    expect(dueChannelsMessage(t, { due: 0, total: 0 })).toBeNull();
  });
});
