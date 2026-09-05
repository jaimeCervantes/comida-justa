/**
 * La estructura de los cuatro pilares: su dirección, su número y su color.
 *
 * **No contiene texto.** El mismo reparto que en `postOriginLabels`: el vocabulario es código
 * —añadir un pilar es editar esta lista— y la redacción es traducción. Cada pilar apunta a su
 * clave del catálogo y el texto lo pone quien traduce.
 */
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import type { PillarKey } from "~/domain/pillars/pillarKey";

/** Reexportada: el tipo vive en el dominio desde que la tabla `pillars` y su caso de uso lo usan. */
export type { PillarKey };

export interface PillarData {
  /** El segmento de la URL. Se queda en español mientras las rutas no se localicen (slice 4). */
  slug: string;
  /** La clave bajo la que vive su texto, en `pillars` y en `pillarPages`. */
  key: PillarKey;
  number: number;
}

export const PILLARS: PillarData[] = [
  { slug: "sueno", key: "sleep", number: 1 },
  { slug: "alimentacion", key: "nutrition", number: 2 },
  { slug: "movimiento", key: "movement", number: 3 },
  { slug: "mente-espiritu", key: "mindSpirit", number: 4 },
];

/**
 * El mismo pilar visto desde el reto (`mind`) y desde la presentación (`mindSpirit`).
 *
 * Son dos vocabularios de verdad —el dominio de hábitos nombra el reto, esta lista nombra el
 * artículo— y solo difieren en el cuarto. Hasta ahora cada página resolvía la equivalencia a mano
 * pasando las dos claves como literales (`challenge="mind"` junto a `pillar="mindSpirit"`), que
 * funciona mientras nadie se equivoque de fila. Escrita una vez, un componente que reciba el reto
 * puede sacar el color sin que quien lo monte tenga que acordarse.
 */
export const PILLAR_KEY_BY_CHALLENGE: Record<
  HabitChallengeExperienceKey,
  PillarKey
> = {
  sleep: "sleep",
  nutrition: "nutrition",
  movement: "movement",
  mind: "mindSpirit",
};

/**
 * Reexportados: el color vive en `presentation/` desde que una segunda ruta lo pinta. Ver
 * `src/presentation/habits/pillarColors.ts` para el porqué de cada clase.
 */
export {
  type PillarColorClasses,
  pillarColorClasses,
} from "~/presentation/habits/pillarColors";

/**
 * El camino de vuelta: de un pilar a su reto.
 *
 * **Se deriva, no se escribe.** `PILLAR_KEY_BY_CHALLENGE` ya es la única fuente de la equivalencia
 * —y existe justamente para que nadie vuelva a emparejarlas a mano—; una segunda tabla escrita en
 * el otro sentido sería la copia que aquella vino a evitar, y se desincronizaría el día que entre un
 * quinto pilar. Lo comprueba `pilaresData.test.ts` recorriendo los cuatro de ida y vuelta.
 *
 * Lo necesita la portada de `/pilares`: el 5.10 pide que cada tarjeta enseñe **su práctica**, y el
 * nombre de la práctica vive bajo la clave del reto (`atomicChallenges.<reto>.title`).
 */
export const CHALLENGE_KEY_BY_PILLAR = Object.fromEntries(
  Object.entries(PILLAR_KEY_BY_CHALLENGE).map(([challenge, pillar]) => [
    pillar,
    challenge,
  ]),
) as Record<PillarKey, HabitChallengeExperienceKey>;
