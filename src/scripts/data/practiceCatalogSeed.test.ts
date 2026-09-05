import { describe, expect, it } from "vitest";
import { PILLAR_SEED, SLEEP_PRACTICE_SEED } from "./practiceCatalogSeed";

/**
 * El contrato de vocabulario entre las tres aplicaciones que comparten la base.
 *
 * `pillars.bot_intent` existe para que «Sleep and rest es el pilar del descanso» se afirme una sola
 * vez, y eso sólo funciona si las cadenas son **exactamente** las que emite el resolutor de
 * intenciones del bot. La lista de referencia vive en
 * `bot-whatsapp/backend/app/use_cases/messages/orchestrator.py` (`product_related_intents`) y se
 * repite dentro del prompt de la tabla `prompts`. Una letra distinta no rompe nada: deja el `JOIN`
 * sin fila y el bot vuelve a contestar con productos, en silencio.
 */
const BOT_INTENTS = [
  "Sleep and rest",
  "Natural and nutritious food",
  "Conscious movement and exercise",
  "Emotional and psychological health",
];

/** Las cuatro raíces de `categories` que son pilares. La base tiene seis; dos no lo son. */
const PILLAR_CATEGORY_ROOTS = [
  "sueno_y_descanso",
  "alimentacion",
  "movimiento_y_ejercicio",
  "mente_y_espiritu",
];

describe("la semilla de los pilares", () => {
  it("nombra las intenciones tal y como las emite el bot", () => {
    expect(PILLAR_SEED.map(({ botIntent }) => botIntent)).toEqual(BOT_INTENTS);
  });

  it("cuelga cada pilar de su raíz de la taxonomía, y de ninguna otra", () => {
    expect(PILLAR_SEED.map(({ categoryKey }) => categoryKey)).toEqual(
      PILLAR_CATEGORY_ROOTS,
    );
  });

  it("no repite ninguna clave, ni de pilar ni de categoría ni de intención", () => {
    for (const field of ["key", "categoryKey", "slug", "botIntent"] as const) {
      const values = PILLAR_SEED.map((pillar) => pillar[field]);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

describe("la semilla de las prácticas de Sueño", () => {
  it("no repite ninguna clave", () => {
    const keys = SLEEP_PRACTICE_SEED.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("da a cada práctica un pilar primario y sólo uno", () => {
    // El primero de la lista es el primario, y el índice parcial de la base rechaza un segundo.
    for (const practice of SLEEP_PRACTICE_SEED) {
      expect(practice.pillars.length).toBeGreaterThan(0);
      expect(new Set(practice.pillars).size).toBe(practice.pillars.length);
    }
  });

  it("tiene la práctica compartida que justifica que `practice_pillars` sea N:N", () => {
    const shared = SLEEP_PRACTICE_SEED.find(
      ({ key }) => key === "sleep-slow-breathing",
    );

    expect(shared?.pillars).toEqual(["mindSpirit", "sleep"]);
  });

  it("dice lo que la evidencia sostiene sobre respirar, no lo que decía el catálogo viejo", () => {
    /* El catálogo de Sueño pedía «alargar la salida del aire» y la nota de Mente decía justo lo
       contrario, citando el ensayo de 2024 que no halló diferencia. Escrita una vez, la
       contradicción no puede volver. */
    const shared = SLEEP_PRACTICE_SEED.find(
      ({ key }) => key === "sleep-slow-breathing",
    );

    expect(shared?.es.howTo).toContain("No persigas una proporción exacta");
    expect(shared?.dois).toContain("10.1007/s10484-024-09637-2");
  });

  it("traduce todas las prácticas a los dos idiomas", () => {
    for (const practice of SLEEP_PRACTICE_SEED) {
      expect(practice.es.title).not.toBe("");
      expect(practice.en.title).not.toBe("");
      expect(practice.es.summary).not.toBe("");
      expect(practice.en.summary).not.toBe("");
    }
  });

  it("liga el reto atómico con la práctica que le corresponde", () => {
    const withChallenge = SLEEP_PRACTICE_SEED.filter(
      ({ challengeKey }) => challengeKey,
    );

    expect(withChallenge).toHaveLength(1);
    expect(withChallenge[0].challengeKey).toBe("sleep-evening-to-morning-v1");
  });
});
