import type { RouteFileProblem } from "~/domain/errors/RouteFileError";

/**
 * Cada problema de un archivo de recorrido, con su clave del catálogo.
 *
 * "No se dibujó nada" no le dice a nadie qué corregir, así que el dominio devuelve un motivo de lista
 * cerrada y aquí se decide cómo se le cuenta.
 *
 * Vive fuera de la Server Action —donde nació— porque ahora el archivo se interpreta en el navegador:
 * **los dos lados** traducen estos motivos. El navegador contesta al elegir el archivo, que es lo
 * bueno del cambio; el servidor sigue contestando lo que solo él puede ver.
 *
 * `satisfies` y no una anotación de tipo, que es la diferencia entre compilar y no: anotarlo como
 * `Record<RouteFileProblem, string>` ensancha los valores a `string` y `next-intl` deja de reconocer
 * la clave —su augmentación de tipos solo acepta los literales del catálogo—. Así se conservan los
 * literales **y** sigue sin compilar el día que alguien sume un motivo sin su mensaje.
 */
export const ROUTE_FILE_ERROR_KEYS = {
  empty: "errorRouteEmpty",
  "not-gpx": "errorRouteNotGpx",
  "too-few-points": "errorRouteTooFewPoints",
  "too-large": "errorRouteTooLarge",
  invalid: "errorRouteInvalid",
} as const satisfies Record<RouteFileProblem, string>;
