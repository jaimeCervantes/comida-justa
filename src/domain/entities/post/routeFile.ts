/**
 * El recorrido **en tránsito**: cómo viaja del navegador al servidor, y qué se comprueba al llegar.
 *
 * Interpretar el `.gpx` es cosa de `gpx.ts`. Lo de aquí existe porque esa interpretación se mudó al
 * navegador, y esa mudanza tiene una razón concreta:
 *
 * El archivo viajaba dentro del cuerpo de la Server Action, y ese cuerpo admite 1 MB. En producción,
 * publicar una rodada con su recorrido reventaba con `Body exceeded 1 MB limit` (413) y quien
 * publicaba perdía todo lo que había escrito. Y era un peaje absurdo además de roto: `parseGpx`
 * reduce a `MAX_ROUTE_POINTS` y **eso** es lo único que acaba en `post_routes`, así que de un GPX de
 * 50.000 puntos el 96% cruzaba la red para ser descartado al llegar.
 *
 * Interpretándolo en el navegador, lo que viaja son los puntos ya reducidos: unos 88 KB **venga de
 * donde venga el archivo**. No hay techo que ajustar, y un archivo que no sirve se rechaza al
 * elegirlo en vez de después de enviar el formulario.
 *
 * Lo que cambia a cambio: los puntos pasan a ser **datos del cliente** en vez de derivarse aquí. No
 * baja la confianza —quien quisiera mentir sobre su ruta ya podía editar el GPX antes de subirlo—,
 * pero sí obliga a comprobar la forma antes de que nada de eso llegue a PostGIS. Eso es
 * `parseRoutePayload`.
 */

import {
  isUsableLatitude,
  isUsableLongitude,
  MAX_REDUCED_ROUTE_POINTS,
  MIN_ROUTE_POINTS,
  type ParsedRoute,
  type RoutePoint,
} from "~/domain/entities/post/gpx";
import RouteFileError, {
  type RouteFileProblem,
} from "~/domain/errors/RouteFileError";

/** Lo que acepta el selector de archivos. */
export const ROUTE_FILE_EXTENSION = ".gpx";

/**
 * Lo que el formulario manda cuando alguien **quita** el recorrido que la publicación ya tenía.
 *
 * Al editar, el campo vacío es ambiguo: significa tanto «no subí ningún archivo» como «quiero
 * quedarme sin recorrido», y esas dos cosas piden lo contrario del servidor —dejar la fila en paz o
 * borrarla—. Vacío se queda con el significado inocente, que es el que ocurre casi siempre; quitar
 * exige decirlo.
 *
 * Es una cadena y no un JSON válido a propósito: `parseRoutePayload` la rechazaría, así que quien
 * la reciba tiene que comprobarla **antes** de intentar interpretarla, y no puede colarse por
 * descuido como si fuera un recorrido.
 */
export const ROUTE_REMOVED = "removed";

/**
 * Lo más grande que el navegador intenta leer.
 *
 * Ya no es un límite de transporte —eso se acabó al dejar de mandar el archivo— sino de la memoria
 * del teléfono de quien publica: leerlo entero como texto reserva su tamaño. 10 MB dejan pasar
 * cualquier ruta real; el caso extremo que documenta `gpx.ts`, 50.000 puntos, ronda los 7 MB.
 */
export const MAX_ROUTE_FILE_BYTES = 10 * 1024 * 1024;

/** Lo que viaja en el campo oculto del formulario. */
interface RoutePayload {
  points: RoutePoint[];
  meters: number;
  originalPoints: number;
}

/**
 * El recorrido, listo para meterlo en el formulario.
 *
 * Se construye campo a campo en vez de serializar `ParsedRoute` entero: así, el día que esa forma
 * gane un dato para otra cosa, no se cuela solo en la petición de todo el que publique.
 */
export function serializeRoute(route: ParsedRoute): string {
  const payload: RoutePayload = {
    points: route.points,
    meters: route.meters,
    originalPoints: route.originalPoints,
  };

  return JSON.stringify(payload);
}

function isRoutePoint(value: unknown): value is RoutePoint {
  if (typeof value !== "object" || value === null) return false;

  const { latitude, longitude } = value as Partial<RoutePoint>;

  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    isUsableLatitude(latitude) &&
    isUsableLongitude(longitude)
  );
}

/**
 * Lo que llegó por el formulario, comprobado.
 *
 * Es la frontera: de aquí para dentro los puntos van a `ST_GeogFromText`, y un valor raro ahí no da
 * un error entendible, da un `INSERT` roto o —peor— una ruta dibujada en otro continente. Se
 * comprueba **todo** lo que se va a guardar, con los mismos rangos que usa `parseGpx` al leer el XML.
 *
 * Lanza `RouteFileError("invalid")` y no devuelve `null`: quien llama ya sabe traducir un problema de
 * esta lista al idioma de quien publica.
 *
 * Los **metros no se recalculan**, se comprueban. `gpx.ts` los mide sobre *todos* los puntos
 * originales a propósito —para que la distancia sea la que la persona corrió y no la del dibujo—, y
 * aquí solo están los reducidos: volver a medirlos encogería el número, que es justo lo que aquel
 * diseño evita.
 */
export function parseRoutePayload(json: string): ParsedRoute {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new RouteFileError("invalid", "El recorrido no es un JSON legible.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new RouteFileError("invalid", "El recorrido no es un objeto.");
  }

  const { points, meters, originalPoints } = parsed as Partial<RoutePayload>;

  if (!Array.isArray(points)) {
    throw new RouteFileError("invalid", "El recorrido no trae sus puntos.");
  }

  if (points.length < MIN_ROUTE_POINTS) {
    throw new RouteFileError(
      "too-few-points",
      `El recorrido trae ${points.length} punto(s) y hacen falta ${MIN_ROUTE_POINTS}.`,
    );
  }

  /* El tope no es decorativo: es lo que mantiene la petición en unos 88 KB y la fila de
     `post_routes` en unos 32 KB. Sin esta comprobación, un formulario manipulado devuelve el
     problema que este cambio vino a quitar, solo que ahora en JSON.

     Se compara contra `MAX_REDUCED_ROUTE_POINTS` y no contra `MAX_ROUTE_POINTS`: el reductor puede
     devolver un punto más que el tope —conserva el último del original—, así que con el segundo esto
     rechazaría rutas perfectamente normales. Lo cazó la prueba del componente, no el repaso. */
  if (points.length > MAX_REDUCED_ROUTE_POINTS) {
    throw new RouteFileError(
      "invalid",
      `El recorrido trae ${points.length} puntos y el tope son ${MAX_REDUCED_ROUTE_POINTS}.`,
    );
  }

  if (!points.every(isRoutePoint)) {
    throw new RouteFileError(
      "invalid",
      "El recorrido trae algún punto que no es una coordenada usable.",
    );
  }

  if (typeof meters !== "number" || !Number.isFinite(meters) || meters <= 0) {
    throw new RouteFileError(
      "invalid",
      `El largo del recorrido no es un número usable: ${meters}.`,
    );
  }

  /* Cuántos puntos traía el archivo. Nunca puede ser menos de los que llegaron —reducir quita
     puntos, no los inventa—, y esa desigualdad es lo único que se puede comprobar de este dato. */
  if (
    typeof originalPoints !== "number" ||
    !Number.isInteger(originalPoints) ||
    originalPoints < points.length
  ) {
    throw new RouteFileError(
      "invalid",
      `El número de puntos del original no cuadra: ${originalPoints} para ${points.length} puntos.`,
    );
  }

  return { points, meters, originalPoints };
}

/**
 * Lo que el campo del recorrido está pidiendo que se haga con la fila de `post_routes`.
 *
 * Son tres cosas distintas y hasta ahora sólo existían dos, porque publicar no puede «conservar»
 * nada: al editar, un campo vacío significa **dejarla como está**, y eso no se puede confundir con
 * borrarla sin que un evento pierda su trazo cada vez que alguien corrige una falta en el título.
 */
export type RouteFieldChange =
  /** No se tocó el campo. Al publicar es «no hay ruta»; al editar, «la de siempre». */
  | { kind: "unchanged" }
  /** Se pidió quitarla, con el gesto explícito que exige {@link ROUTE_REMOVED}. */
  | { kind: "removed" }
  /** Llegó un recorrido nuevo, ya validado. Al publicar se guarda; al editar, reemplaza. */
  | { kind: "replaced"; route: ParsedRoute }
  /** Llegó algo que dice ser un recorrido y no lo es. El motivo se le enseña a la persona. */
  | { kind: "invalid"; problem: RouteFileProblem };

/**
 * Interpreta el campo oculto del recorrido, venga de publicar o de editar.
 *
 * **Vive en el dominio y no en cada acción** porque es el significado del dato, no el trámite de
 * una pantalla: las dos rutas leen el mismo campo y tienen que entenderlo igual. Existía una copia
 * privada en `publicar/actions.ts` que sólo distinguía dos casos; editar necesitaba tres, y la
 * salida no era duplicarla con una rama más.
 *
 * `ROUTE_REMOVED` se comprueba **antes** de intentar interpretar nada: no es un JSON válido, así que
 * pasarlo por `parseRoutePayload` lo convertiría en un error de archivo ilegible y quien quiso
 * quitar su ruta recibiría «ese archivo no sirve».
 */
export function readRouteField(
  entry: string | null | undefined,
): RouteFieldChange {
  const payload = typeof entry === "string" ? entry.trim() : "";

  if (!payload) return { kind: "unchanged" };
  if (payload === ROUTE_REMOVED) return { kind: "removed" };

  try {
    return { kind: "replaced", route: parseRoutePayload(payload) };
  } catch (error) {
    if (error instanceof RouteFileError)
      return { kind: "invalid", problem: error.problem };

    throw error;
  }
}
