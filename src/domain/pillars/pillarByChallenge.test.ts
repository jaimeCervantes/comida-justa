import { describe, expect, it } from "vitest";
import {
  CHALLENGE_KEY_BY_PILLAR,
  PILLAR_KEY_BY_CHALLENGE,
} from "./pillarByChallenge";
import { PILLAR_KEYS } from "./pillarKey";

describe("La equivalencia entre pilar y reto", () => {
  /**
   * Se deriva de `PILLAR_KEY_BY_CHALLENGE` en vez de escribirse otra vez. Esta prueba es lo que
   * convierte esa derivación en garantía: los cuatro tienen que poder ir y volver sin perderse, y
   * el día que entre un quinto pilar sin reto —o al revés— se pone roja aquí.
   */
  it("va y vuelve por los cuatro sin perder ninguno", () => {
    for (const pillar of PILLAR_KEYS) {
      const challenge = CHALLENGE_KEY_BY_PILLAR[pillar];

      expect(challenge, `el pilar «${pillar}» no tiene reto`).toBeDefined();
      expect(PILLAR_KEY_BY_CHALLENGE[challenge]).toBe(pillar);
    }
  });

  it("cubre todos los retos, sin sobras", () => {
    expect(Object.keys(CHALLENGE_KEY_BY_PILLAR).sort()).toEqual(
      Object.values(PILLAR_KEY_BY_CHALLENGE).sort(),
    );
  });

  /** El cuarto es el que difiere: el reto se llama `mind` y el pilar `mindSpirit`. */
  it("resuelve el par que no se llama igual", () => {
    expect(CHALLENGE_KEY_BY_PILLAR.mindSpirit).toBe("mind");
  });
});
