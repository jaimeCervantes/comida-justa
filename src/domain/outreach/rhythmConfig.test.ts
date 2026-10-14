import { describe, expect, it } from "vitest";
import { DEFAULT_OUTREACH_RHYTHM, resolveOutreachRhythm } from "./rhythmConfig";

/** La corrida de escritorio del slice 4.1 de `difusionEnGrupos.feature`. */
describe("el tope y la pausa se cambian por variable de entorno, y lo inválido se ignora", () => {
  it.each([
    {
      porQue: "sin variables, los valores por omisión",
      tope: undefined,
      pausa: undefined,
      queda: { dailyLimit: 10, pauseMinutes: 10 },
      rechazados: [],
    },
    {
      porQue: "lo que diga el entorno",
      tope: "15",
      pausa: "5",
      queda: { dailyLimit: 15, pauseMinutes: 5 },
      rechazados: [],
    },
    {
      porQue: "un tope de 0 no sirve; una pausa de 0 la apaga",
      tope: "0",
      pausa: "0",
      queda: { dailyLimit: 10, pauseMinutes: 0 },
      rechazados: ["dailyLimit"],
    },
    {
      porQue: "lo que no es un número entero se ignora",
      tope: "diez",
      pausa: "10m",
      queda: { dailyLimit: 10, pauseMinutes: 10 },
      rechazados: ["dailyLimit", "pauseMinutes"],
    },
    {
      porQue: "fuera de rango se ignora",
      tope: "500",
      pausa: "300",
      queda: { dailyLimit: 10, pauseMinutes: 10 },
      rechazados: ["dailyLimit", "pauseMinutes"],
    },
  ])("$porQue", ({ tope, pausa, queda, rechazados }) => {
    expect(
      resolveOutreachRhythm({ dailyLimit: tope, pauseMinutes: pausa }),
    ).toEqual({ rhythm: queda, rejected: rechazados });
  });

  it("una variable vacía o de puros espacios es como no tenerla", () => {
    expect(
      resolveOutreachRhythm({ dailyLimit: "", pauseMinutes: "  " }),
    ).toEqual({ rhythm: DEFAULT_OUTREACH_RHYTHM, rejected: [] });
  });

  it("acepta espacios alrededor del número, que es como se pega en un panel", () => {
    expect(
      resolveOutreachRhythm({ dailyLimit: " 12 ", pauseMinutes: "15\n" })
        .rhythm,
    ).toEqual({ dailyLimit: 12, pauseMinutes: 15 });
  });

  it("los valores por omisión son 10 y 10 mientras nadie los mueva", () => {
    expect(DEFAULT_OUTREACH_RHYTHM).toEqual({
      dailyLimit: 10,
      pauseMinutes: 10,
    });
  });
});
