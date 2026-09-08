/**
 * La semilla del catálogo: los cuatro pilares, su bibliografía y sus prácticas.
 *
 * **Es contenido, no esquema.** Las tablas las creó Alembic (`0049` y `0050`); esto las llena, y es
 * idempotente. Cada pilar trae sus prácticas en su propio módulo: son cuatro cuerpos de contenido
 * independientes, y juntarlos en un archivo sólo garantizaría conflictos al editarlos.
 *
 * `PILLAR_BIBLIOGRAPHY` y `PRACTICE_SEED` son las dos listas que el sembrador recorre, y viven aquí
 * para que añadir un pilar sea editar **una** tabla y no buscar dónde más estaba enumerado.
 */
import type { PillarKey } from "~/domain/pillars/pillarKey";
import { MIND_PRACTICE_SEED } from "./mindPractices";
import { MOVEMENT_PRACTICE_SEED } from "./movementPractices";
import { NUTRITION_PRACTICE_SEED } from "./nutritionPractices";
import {
  MIND_SPIRIT_BIBLIOGRAPHY,
  MOVEMENT_BIBLIOGRAPHY,
  NUTRITION_BIBLIOGRAPHY,
  SLEEP_BIBLIOGRAPHY,
} from "./pillarBibliography";
import type { PracticeSeed } from "./practiceSeed";
import { SLEEP_PRACTICE_SEED } from "./sleepPractices";

/** El pilar, tal como lo nombran la taxonomía, la URL y el bot. */
export type PillarSeed = {
  key: PillarKey;
  categoryKey: string;
  slug: string;
  /**
   * La intención con la que el bot de Telegram nombra este pilar.
   *
   * Los valores son exactamente los de `product_related_intents` en
   * `bot-whatsapp/backend/app/use_cases/messages/orchestrator.py`. Una letra distinta y el `JOIN`
   * deja de encontrar el pilar, así que se copian, no se traducen.
   */
  botIntent: string;
  sortOrder: number;
  /** Los DOIs que forman su cuerpo de evidencia, en el orden en que se construyó la lista. */
  bibliography: readonly string[];
  /** Las prácticas cuyo pilar primario es este. Una práctica puede servir a otros. */
  practices: readonly PracticeSeed[];
};

export const PILLAR_SEED: readonly PillarSeed[] = [
  {
    key: "sleep",
    categoryKey: "sueno_y_descanso",
    slug: "sueno",
    botIntent: "Sleep and rest",
    sortOrder: 10,
    bibliography: SLEEP_BIBLIOGRAPHY,
    practices: SLEEP_PRACTICE_SEED,
  },
  {
    key: "nutrition",
    categoryKey: "alimentacion",
    slug: "alimentacion",
    botIntent: "Natural and nutritious food",
    sortOrder: 20,
    bibliography: NUTRITION_BIBLIOGRAPHY,
    practices: NUTRITION_PRACTICE_SEED,
  },
  {
    key: "movement",
    categoryKey: "movimiento_y_ejercicio",
    slug: "movimiento",
    botIntent: "Conscious movement and exercise",
    sortOrder: 30,
    bibliography: MOVEMENT_BIBLIOGRAPHY,
    practices: MOVEMENT_PRACTICE_SEED,
  },
  {
    key: "mindSpirit",
    categoryKey: "mente_y_espiritu",
    slug: "mente-espiritu",
    botIntent: "Emotional and psychological health",
    sortOrder: 40,
    bibliography: MIND_SPIRIT_BIBLIOGRAPHY,
    practices: MIND_PRACTICE_SEED,
  },
];

/** Todas las prácticas, de los cuatro pilares, en el orden en que se siembran. */
export const PRACTICE_SEED: readonly PracticeSeed[] = PILLAR_SEED.flatMap(
  ({ practices }) => practices,
);

/**
 * Claves que existieron y ya no.
 *
 * `sleep-slow-breathing` se sembró en el slice 1 bajo el pilar del sueño y en el slice 2 pasó a
 * llamarse `mind-slow-breathing`, porque su pilar primario siempre fue Mente y la clave decía otra
 * cosa. El sembrador no puede adivinarlo: un `INSERT … ON CONFLICT (key)` con la clave nueva crea
 * una fila y deja la vieja huérfana, con sus traducciones y sus citas colgando.
 *
 * La lista se recorre y se borra. Está aquí y no en una migración porque son **datos sembrados**,
 * no esquema: quien vuelva a sembrar desde cero nunca creará esas filas.
 */
export const RETIRED_PRACTICE_KEYS: readonly string[] = [
  "sleep-slow-breathing",
];

export type { PracticeSeed, PracticeTranslationSeed } from "./practiceSeed";
