/**
 * La estructura de los cuatro pilares: su dirección, su número y su color.
 *
 * **No contiene texto.** El mismo reparto que en `postOriginLabels`: el vocabulario es código
 * —añadir un pilar es editar esta lista— y la redacción es traducción. Cada pilar apunta a su
 * clave del catálogo y el texto lo pone quien traduce.
 */
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
 * Reexportadas: la equivalencia entre reto y pilar es dominio desde que el repositorio de prácticas
 * la usa. Ver `src/domain/pillars/pillarByChallenge.ts`.
 */
export {
  CHALLENGE_KEY_BY_PILLAR,
  PILLAR_KEY_BY_CHALLENGE,
} from "~/domain/pillars/pillarByChallenge";

/**
 * Reexportados: el color vive en `presentation/` desde que una segunda ruta lo pinta. Ver
 * `src/presentation/habits/pillarColors.ts` para el porqué de cada clase.
 */
export {
  type PillarColorClasses,
  pillarColorClasses,
} from "~/presentation/habits/pillarColors";
