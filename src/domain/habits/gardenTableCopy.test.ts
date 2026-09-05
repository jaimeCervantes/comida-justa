import { describe, expect, it } from "vitest";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";

/**
 * La tabla del jardín no proclama a nadie.
 *
 * Se comprueba sobre el **catálogo de textos** y no sobre la página, porque es ahí donde un podio
 * volvería: no reintroduciendo un `rank` en el dominio —eso ya lo cubre `habitLeagueUseCase.test.ts`—
 * sino escribiendo «1er lugar» o «ganadora de la semana» en una clave nueva. Un intento anterior de
 * afirmarlo recorriendo la sección en Playwright se caía sola: la nota de ética dice «no hay
 * ganador», y buscar esa palabra encontraba justamente la frase que promete lo contrario.
 *
 * Se miran los **valores**, no las claves, y se excluye `ethics`, que es la única que puede nombrar
 * lo que no hay.
 */
const PROCLAMA =
  /\b(ganador|ganadora|campe[oó]n|campeona|primer lugar|1(er|\.º)? lugar|winner|champion|first place|podio|podium|trofeo|troph)/i;

describe("los textos de la tabla del jardín", () => {
  it.each([
    ["es", es.atomicChallenges.league],
    ["en", en.atomicChallenges.league],
  ])("en %s no proclaman a nadie", (_locale, league) => {
    for (const [key, value] of Object.entries(league)) {
      if (key === "ethics") continue;
      expect(value, key).not.toMatch(PROCLAMA);
    }
  });

  it("sólo `ethics` puede nombrar lo que no hay, y lo nombra para negarlo", () => {
    expect(es.atomicChallenges.league.ethics).toMatch(/No hay ganador/);
    expect(en.atomicChallenges.league.ethics).toMatch(/No winner/);
  });

  it("no queda ninguna clave de puesto, en ninguno de los dos idiomas", () => {
    for (const league of [
      es.atomicChallenges.league,
      en.atomicChallenges.league,
    ]) {
      expect(Object.keys(league)).not.toContain("rank");
      expect(Object.keys(league)).not.toContain("points");
    }
  });
});
