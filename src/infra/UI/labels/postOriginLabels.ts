import { originsForUser, type PostOrigin } from "~/domain/entities/post/origin";

/**
 * La clave del catálogo de cada procedencia **es** la de la allowlist del dominio.
 *
 * El reparto es a propósito: el vocabulario es código —agregar una procedencia sigue siendo editar
 * `POST_ORIGINS`— y la redacción es traducción. Este módulo hace de puente entre los dos y no
 * conoce ningún texto.
 *
 * Las claves se escriben enteras y literales para que un `grep origin.productor` las encuentre, y
 * el `satisfies` obliga a que estén las cinco: añadir una procedencia a la allowlist sin nombrarla
 * aquí no compila.
 */
export const ORIGIN_LABEL_KEYS = {
  hazlo_sano_propio: "origin.hazlo_sano_propio",
  hazlo_sano_reventa: "origin.hazlo_sano_reventa",
  productor: "origin.productor",
  reventa_cercana: "origin.reventa_cercana",
  reventa_lejana: "origin.reventa_lejana",
} as const satisfies Record<PostOrigin, string>;

/**
 * La misma procedencia, preguntada al vendedor.
 *
 * Son dos redacciones porque son dos actos de habla distintos: en el reporte de `/admin/productos`
 * la procedencia es un **nombre** ("Reventa lejana"), y en el formulario es una **pregunta sobre lo
 * suyo** — y nadie dice "reventa lejana" hablando de su propio changarro.
 */
export const ORIGIN_QUESTION_KEYS = {
  hazlo_sano_propio: "originQuestion.hazlo_sano_propio",
  hazlo_sano_reventa: "originQuestion.hazlo_sano_reventa",
  productor: "originQuestion.productor",
  reventa_cercana: "originQuestion.reventa_cercana",
  reventa_lejana: "originQuestion.reventa_lejana",
} as const satisfies Record<PostOrigin, string>;

export const UNSPECIFIED_ORIGIN_KEY = "origin.unspecified";

export type OriginLabelKey =
  | (typeof ORIGIN_LABEL_KEYS)[PostOrigin]
  | typeof UNSPECIFIED_ORIGIN_KEY;

export type OriginQuestionKey = (typeof ORIGIN_QUESTION_KEYS)[PostOrigin];

/** La clave que nombra a esta procedencia; el texto lo pone quien traduce. */
export function originLabelKey(origin: PostOrigin | null): OriginLabelKey {
  return origin ? ORIGIN_LABEL_KEYS[origin] : UNSPECIFIED_ORIGIN_KEY;
}

export interface OriginOption {
  value: PostOrigin;
  labelKey: OriginQuestionKey;
}

/**
 * Las procedencias del selector, en el orden canónico de la allowlist y ya filtradas por rol.
 *
 * Quién puede declarar qué lo decide el dominio (`originsForUser`), no esta capa: esconder una
 * opción es cortesía con quien llena el formulario, la defensa de verdad está en el servidor
 * (`resolveOriginForUser`).
 */
export function originOptionsFor(isAdmin: boolean): readonly OriginOption[] {
  return originsForUser(isAdmin).map((value) => ({
    value,
    labelKey: ORIGIN_QUESTION_KEYS[value],
  }));
}
