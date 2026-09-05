import { describe, expect, it } from "vitest";
import { PILLAR_THEME_SEED } from "./pillarThemes";
import {
  PILLAR_SEED,
  PRACTICE_SEED,
  RETIRED_PRACTICE_KEYS,
} from "./practiceCatalogSeed";

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

/** Los cuatro retos atómicos que ya existían, con su clave versionada. */
const CHALLENGE_KEYS = [
  "sleep-evening-to-morning-v1",
  "nutrition-one-plant-v1",
  "movement-two-minutes-v1",
  "mind-one-connection-v1",
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

  it("da a cada pilar su bibliografía, sin repetir un DOI dentro de ella", () => {
    for (const { key, bibliography } of PILLAR_SEED) {
      expect(bibliography.length, key).toBeGreaterThan(0);
      expect(new Set(bibliography).size, key).toBe(bibliography.length);
    }
  });

  it("no cita el mismo estudio en dos bibliografías", () => {
    // Un estudio puede sostener prácticas de varios pilares, pero pertenece al cuerpo de evidencia
    // de uno. Si eso deja de ser cierto habrá que decidirlo a propósito, no descubrirlo en la página.
    const all = PILLAR_SEED.flatMap(({ bibliography }) => bibliography);
    expect(new Set(all).size).toBe(all.length);
  });

  it("nunca guarda el resolutor dentro del identificador", () => {
    for (const doi of PILLAR_SEED.flatMap(({ bibliography }) => bibliography)) {
      expect(doi.startsWith("10."), doi).toBe(true);
    }
  });
});

describe("la semilla de las prácticas", () => {
  it("no repite ninguna clave entre los cuatro pilares", () => {
    const keys = PRACTICE_SEED.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("da a cada práctica un pilar primario y sólo uno", () => {
    // El primero de la lista es el primario, y el índice parcial de la base rechaza un segundo.
    for (const practice of PRACTICE_SEED) {
      expect(practice.pillars.length, practice.key).toBeGreaterThan(0);
      expect(new Set(practice.pillars).size, practice.key).toBe(
        practice.pillars.length,
      );
    }
  });

  it("liga cada reto atómico con una práctica, y sólo una", () => {
    const linked = PRACTICE_SEED.map(({ challengeKey }) => challengeKey).filter(
      (key): key is string => Boolean(key),
    );

    expect(linked.sort()).toEqual([...CHALLENGE_KEYS].sort());
  });

  it("cita sólo DOIs, nunca URLs", () => {
    for (const { key, dois } of PRACTICE_SEED) {
      for (const doi of dois) expect(doi.startsWith("10."), key).toBe(true);
    }
  });

  it("traduce todas las prácticas a los dos idiomas", () => {
    for (const practice of PRACTICE_SEED) {
      for (const copy of [practice.es, practice.en]) {
        expect(copy.title.length, practice.key).toBeGreaterThan(0);
        expect(copy.summary.length, practice.key).toBeGreaterThan(0);
      }
    }
  });

  it("tiene una práctica en cada pilar, no sólo en el del descanso", () => {
    const primary = new Set(PRACTICE_SEED.map(({ pillars }) => pillars[0]));

    expect(primary).toEqual(
      new Set(["sleep", "nutrition", "movement", "mindSpirit"]),
    );
  });
});

describe("las prácticas compartidas", () => {
  /** Las que justifican que `practice_pillars` sea N:N y no una columna. */
  const shared = PRACTICE_SEED.filter(({ pillars }) => pillars.length > 1);

  it("existen, y son varias", () => {
    expect(shared.length).toBeGreaterThan(1);
  });

  it("respirar despacio es de Mente y también de Sueño", () => {
    const breathing = PRACTICE_SEED.find(
      ({ key }) => key === "mind-slow-breathing",
    );

    expect(breathing?.pillars).toEqual(["mindSpirit", "sleep"]);
  });

  it("dice lo que la evidencia sostiene sobre respirar, no lo que decía el catálogo viejo", () => {
    /* El catálogo de Sueño pedía «alargar la salida del aire» y la nota de Mente decía justo lo
       contrario, citando el ensayo de 2024 que no halló diferencia. Escrita una vez, la
       contradicción no puede volver. */
    const breathing = PRACTICE_SEED.find(
      ({ key }) => key === "mind-slow-breathing",
    );

    expect(breathing?.es.howTo).toContain("No persigas una proporción exacta");
    expect(breathing?.dois).toContain("10.1007/s10484-024-09637-2");
  });
});

describe("las claves retiradas", () => {
  it("nombra la que se renombró, para que el sembrador la borre", () => {
    /* `sleep-slow-breathing` pasó a `mind-slow-breathing`. Un upsert por clave crea la fila nueva y
       deja la vieja huérfana con sus traducciones y sus citas colgando; el sembrador no puede
       adivinar un renombre, así que se le dice. */
    expect(RETIRED_PRACTICE_KEYS).toContain("sleep-slow-breathing");
  });

  it("no retira ninguna clave que la semilla siga usando", () => {
    const live = new Set(PRACTICE_SEED.map(({ key }) => key));

    for (const retired of RETIRED_PRACTICE_KEYS) {
      expect(live.has(retired), retired).toBe(false);
    }
  });
});

describe("los temas del catálogo", () => {
  /** La invariante que la base no puede afirmar: el tema de una práctica es de su propio pilar. */
  const practiceByKey = new Map(PRACTICE_SEED.map((p) => [p.key, p]));

  it("agrupa sólo prácticas del pilar del tema", () => {
    for (const theme of PILLAR_THEME_SEED) {
      for (const key of theme.practices) {
        const practice = practiceByKey.get(key);
        expect(practice, `${theme.key} → ${key}`).toBeDefined();
        expect(practice?.pillars[0], `${theme.key} → ${key}`).toBe(
          theme.pillar,
        );
      }
    }
  });

  it("no mete una práctica en dos temas", () => {
    const assigned = PILLAR_THEME_SEED.flatMap(({ practices }) => practices);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it("no repite claves de tema ni deja un pilar sin ninguno", () => {
    const keys = PILLAR_THEME_SEED.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);

    const pillars = new Set(PILLAR_THEME_SEED.map(({ pillar }) => pillar));
    expect(pillars).toEqual(
      new Set(["sleep", "nutrition", "movement", "mindSpirit"]),
    );
  });

  it("traduce título y los dos impactos en los dos idiomas", () => {
    for (const theme of PILLAR_THEME_SEED) {
      for (const copy of [theme.es, theme.en]) {
        expect(copy.title.length, theme.key).toBeGreaterThan(0);
        expect(copy.bodyImpact.length, theme.key).toBeGreaterThan(0);
        expect(copy.localImpact.length, theme.key).toBeGreaterThan(0);
      }
    }
  });

  it("deja fuera los cuatro rituales: son la insignia del pilar, no una fila del catálogo", () => {
    const assigned = new Set(
      PILLAR_THEME_SEED.flatMap(({ practices }) => practices),
    );

    for (const practice of PRACTICE_SEED) {
      if (practice.challengeKey) {
        expect(assigned.has(practice.key), practice.key).toBe(false);
      }
    }
  });
});

describe("el respaldo de cada práctica", () => {
  /**
   * **Toda práctica publicada cita al menos un estudio.** Es la regla que el usuario pidió, y vive
   * aquí porque aquí es donde se rompería: añadir una práctica nueva es escribir un objeto en el
   * módulo de su pilar, y `dois: []` compila igual de bien que una lista.
   *
   * La base no puede afirmarlo —haría falta un CHECK que consultara otra tabla—, así que lo afirma
   * la semilla, que es la única fuente de estas filas.
   */
  it("ninguna práctica se publica sin al menos un estudio", () => {
    const huerfanas = PRACTICE_SEED.filter(({ dois }) => dois.length === 0);

    expect(huerfanas.map(({ key }) => key)).toEqual([]);
  });

  it("cada DOI citado existe en la bibliografía de algún pilar", () => {
    /* Un DOI que sólo estuviera en `practice_studies` no llegaría a `studies` —las siembra la
       bibliografía— y el vínculo se perdería en silencio: la práctica diría tener respaldo y la
       página no enseñaría ninguno. */
    const bibliography = new Set(
      PILLAR_SEED.flatMap(({ bibliography: dois }) => dois),
    );

    for (const { key, dois } of PRACTICE_SEED) {
      for (const doi of dois) {
        expect(bibliography.has(doi), `${key} → ${doi}`).toBe(true);
      }
    }
  });

  it("no cita dos veces el mismo estudio en la misma práctica", () => {
    for (const { key, dois } of PRACTICE_SEED) {
      expect(new Set(dois).size, key).toBe(dois.length);
    }
  });
});
