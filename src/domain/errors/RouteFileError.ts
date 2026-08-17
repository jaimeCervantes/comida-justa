/** Por qué un archivo de ruta no sirve. Lista cerrada: cada motivo tiene su clave en el catálogo. */
export const ROUTE_FILE_PROBLEMS = [
  "empty",
  "not-gpx",
  "too-few-points",
] as const;

export type RouteFileProblem = (typeof ROUTE_FILE_PROBLEMS)[number];

/**
 * El archivo que subieron no se puede leer como recorrido.
 *
 * Es un error **esperado**, no excepcional: la gente sube el archivo equivocado. Lleva un motivo de
 * lista cerrada para que la capa de aplicación lo traduzca —"no se dibujó nada" no le dice a nadie
 * qué corregir— y el mensaje en español es solo para el registro del servidor.
 */
export default class RouteFileError extends Error {
  readonly problem: RouteFileProblem;

  constructor(problem: RouteFileProblem, message: string) {
    super(message);
    this.name = "RouteFileError";
    this.problem = problem;
  }
}
