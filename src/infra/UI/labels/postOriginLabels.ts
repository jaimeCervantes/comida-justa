import { POST_ORIGINS, type PostOrigin } from "~/domain/entities/post/origin";

/**
 * La clave del catálogo de cada procedencia **es** la de la allowlist del dominio.
 *
 * El reparto es a propósito: el vocabulario es código —agregar una procedencia sigue siendo editar
 * `POST_ORIGINS`— y la redacción es traducción. Este módulo hace de puente entre los dos y no
 * conoce ningún texto.
 *
 * Las claves se escriben enteras y literales para que un `grep origin.productor_local` las
 * encuentre, y el `satisfies` obliga a que estén las seis: añadir una procedencia a la allowlist
 * sin nombrarla aquí no compila.
 */
export const ORIGIN_LABEL_KEYS = {
  hazlo_sano_propio: "origin.hazlo_sano_propio",
  hazlo_sano_reventa: "origin.hazlo_sano_reventa",
  productor_local: "origin.productor_local",
  reventa_local: "origin.reventa_local",
  productor_foraneo: "origin.productor_foraneo",
  reventa_foranea: "origin.reventa_foranea",
} as const satisfies Record<PostOrigin, string>;

export const UNSPECIFIED_ORIGIN_KEY = "origin.unspecified";

export type OriginLabelKey =
  | (typeof ORIGIN_LABEL_KEYS)[PostOrigin]
  | typeof UNSPECIFIED_ORIGIN_KEY;

/** La clave que nombra a esta procedencia; el texto lo pone quien traduce. */
export function originLabelKey(origin: PostOrigin | null): OriginLabelKey {
  return origin ? ORIGIN_LABEL_KEYS[origin] : UNSPECIFIED_ORIGIN_KEY;
}

/** Las procedencias del selector, en el orden canónico de la allowlist. */
export const ORIGIN_OPTIONS: ReadonlyArray<{
  value: PostOrigin;
  labelKey: OriginLabelKey;
}> = POST_ORIGINS.map((value) => ({
  value,
  labelKey: ORIGIN_LABEL_KEYS[value],
}));
