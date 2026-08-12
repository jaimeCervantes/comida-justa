import { describe, expect, it, vi } from "vitest";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import type { AppLocale } from "~/i18n/routing";
import { getPillarPracticeCopy } from "./pillarPracticeCopy";

/**
 * La copia de la práctica se arma en el servidor, así que `getTranslations` no tiene petición de
 * Next de dónde leer. Se sustituye por un traductor sobre el catálogo **real** —el mismo criterio
 * que `renderWithIntl`— para que esto sea una prueba de lo que la página va a mostrar y no de un
 * catálogo de mentira que nadie ve.
 */
const active = vi.hoisted(() => ({ locale: "es" as AppLocale }));

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const catalogs = {
    es: (await import("~/i18n/messages/es.json")).default,
    en: (await import("~/i18n/messages/en.json")).default,
  };

  return {
    getTranslations: async (namespace: "atomicSleepChallenge") =>
      createTranslator({
        locale: active.locale,
        messages: catalogs[active.locale],
        namespace,
      }),
  };
});

async function practiceCopyIn(
  locale: AppLocale,
  challenge: HabitChallengeExperienceKey,
) {
  active.locale = locale;
  return getPillarPracticeCopy(challenge);
}

/**
 * El ritual de Alimentación es el único de seis pasos: abastecerse cerca, cenar al atardecer,
 * cocinar limpio, servir la triada, cenar en presencia y notar el triple impacto. El número no es
 * decoración —es lo que separa una cena completa de «súmale una planta»— y ninguna otra prueba lo
 * vería desaparecer: la sección pinta los pasos que le den, y si el lector volviera a pedir cinco
 * el sexto se caería en silencio.
 */
describe.each([
  { challenge: "sleep", steps: 5 },
  { challenge: "nutrition", steps: 6 },
  { challenge: "movement", steps: 5 },
  { challenge: "mind", steps: 5 },
] as const satisfies readonly {
  challenge: HabitChallengeExperienceKey;
  steps: number;
}[])("the $challenge ritual", ({ challenge, steps }) => {
  it.each(["es", "en"] as const satisfies readonly AppLocale[])(
    `has its %s steps written, none of them empty`,
    async (locale) => {
      const copy = await practiceCopyIn(locale, challenge);

      expect(copy.ritual.steps).toHaveLength(steps);
      for (const step of copy.ritual.steps) {
        expect(step.trim()).not.toBe("");
      }
    },
  );
});

describe("the nutrition practice", () => {
  it("anchors dinner at sundown and the plate on the local triad", async () => {
    const copy = await practiceCopyIn("es", "nutrition");
    const [cue, minimum] = copy.anchors;

    expect(copy.title).toBe("Cena real, local y al atardecer");
    expect(cue.title).toBe("Cenar al atardecer");
    expect(cue.body).toContain("6:00 y las 7:30 PM");
    expect(cue.body).toContain("2.5 a 3 horas antes de dormir");
    expect(minimum.title).toBe("Servir la triada local");
    expect(minimum.body).toContain("una planta más");
  });

  /**
   * Abastecerse en el mercado local es lo que hace fácil todo lo demás, pero cobrarlo como
   * requisito dejaría fuera a quien esa semana solo pudo ir al súper. Vive en la nota, que es el
   * lugar de lo que ayuda y no obliga.
   */
  it("keeps local sourcing as help and never as a requirement", async () => {
    const copy = await practiceCopyIn("es", "nutrition");

    expect(copy.note?.title).toBe("Abastecerte cerca, no aprobar un examen");
    expect(copy.note?.body).toContain("nunca un requisito");
  });

  it("opens the ritual at the market and closes it on the triple impact", async () => {
    const copy = await practiceCopyIn("es", "nutrition");

    expect(copy.ritual.steps.at(0)).toContain("Abastecerte cerca");
    expect(copy.ritual.steps.at(-1)).toContain("Notar el triple impacto");
  });
});
