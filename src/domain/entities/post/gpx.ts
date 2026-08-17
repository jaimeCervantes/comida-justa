/**
 * Leer un GPX y sacarle el recorrido.
 *
 * Quien corre ya tiene su ruta en Strava, Garmin o Wikiloc: exporta y sube. Eso es lo que permite
 * aplazar el editor de mapa, que es la parte cara de esta feature.
 *
 * **Sin dependencia de XML, a propósito.** Es el mismo criterio que `GeminiTranslationService`
 * ("~40 líneas contra una dependencia más en el bundle del servidor"): de un GPX solo hacen falta
 * los pares `lat`/`lon` de sus puntos, en orden. Un parser de XML completo traería namespaces,
 * entidades y validación de esquema para leer dos atributos.
 */

import RouteFileError from "~/domain/errors/RouteFileError";

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export type ParsedRoute = {
  /** Los puntos que se guardan y se dibujan, ya reducidos si venían de sobra. */
  points: RoutePoint[];
  /**
   * Los metros del recorrido, medidos sobre **todos** los puntos originales.
   *
   * Se calcula antes de reducir a propósito: el número tiene que ser fiel —quien corre sabe si su
   * ruta son 8 km o 7,6— mientras que el dibujo solo tiene que parecerse. Reducir primero y medir
   * después haría que la distancia encogiera con cada punto descartado.
   */
  meters: number;
  /** Cuántos puntos traía el archivo antes de reducir. Para poder decirlo en el registro. */
  originalPoints: number;
};

/**
 * El tope de puntos que se guardan.
 *
 * Una carrera de 20 km grabada cada segundo trae ~7.000 puntos, y hay ficheros de 50.000. Dibujar
 * eso en una pantalla de 1.000 píxeles no se ve mejor, y sí pesa: 50.000 puntos son ~800 KB por
 * publicación.
 *
 * **Se reduce en vez de rechazar** porque un archivo de 7.000 puntos es un archivo legítimo de una
 * persona real, y negárselo sería castigar al que mejor grabó su ruta.
 */
export const MAX_ROUTE_POINTS = 2_000;

/** Una línea necesita dos puntos. Con uno no hay recorrido, hay un sitio. */
const MIN_ROUTE_POINTS = 2;

/** Los puntos de un track (`trkpt`) y, si no hay, los de una ruta declarada (`rtept`). */
const TRACK_POINT = /<(trkpt|rtept)\b([^>]*)>/gi;
const LATITUDE = /\blat\s*=\s*["']([^"']+)["']/i;
const LONGITUDE = /\blon\s*=\s*["']([^"']+)["']/i;

function isUsableLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isUsableLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * Los metros entre dos puntos por la fórmula del haversine.
 *
 * Se mide aquí y no con `ST_Length` en la base para que el dominio pueda decir cuánto mide una ruta
 * sin consultar nada — y para poder probarlo contra distancias conocidas. La base guarda el mismo
 * número y puede comprobarlo por su cuenta si algún día hace falta.
 */
/**
 * La Tierra como esfera, no como elipsoide — y la diferencia está medida.
 *
 * PostGIS sobre `geography` usa el elipsoide WGS84 y da **110.574 m** por grado de latitud en el
 * ecuador; esta esfera da **111.195 m**. O sea que este número y `ST_Length(path)` **no coinciden**:
 * se separan un ~0,6% como mucho, unos 35 m en una ruta de 8 km.
 *
 * Se acepta a sabiendas. Lo que importa aquí es que el número sea fiel al recorrido que la persona
 * grabó, y para eso pesa mucho más medir sobre **todos** los puntos que sobre los reducidos —eso sí
 * encogería la distancia de verdad— que la forma exacta del planeta. Quien alguna vez necesite el
 * número del elipsoide lo tiene en la columna `path` con `ST_Length`, y ahora sabe por qué difiere.
 */
const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function metersBetween(a: RoutePoint, b: RoutePoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** El largo del recorrido: la suma de sus tramos. */
export function routeLengthInMeters(points: readonly RoutePoint[]): number {
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    total += metersBetween(points[i - 1], points[i]);
  }

  return total;
}

/**
 * Deja como mucho `MAX_ROUTE_POINTS`, **conservando siempre el primero y el último**.
 *
 * Perder el último punto movería el final de la ruta, que es justo donde la gente mira para saber
 * dónde termina.
 */
export function reducePoints(
  points: readonly RoutePoint[],
  max: number = MAX_ROUTE_POINTS,
): RoutePoint[] {
  if (points.length <= max) return [...points];

  const step = Math.ceil(points.length / max);
  const reduced = points.filter((_, index) => index % step === 0);
  const last = points[points.length - 1];

  if (reduced[reduced.length - 1] !== last) reduced.push(last);

  return reduced;
}

/**
 * Interpreta el contenido de un `.gpx`.
 *
 * Lanza `RouteFileError` con un motivo de lista cerrada en vez de devolver algo vacío: quien sube un
 * archivo que no sirve necesita saber **qué** le pasa, y "no se dibujó nada" no lo dice.
 */
export function parseGpx(content: string): ParsedRoute {
  if (!content?.trim()) {
    throw new RouteFileError("empty", "El archivo está vacío.");
  }

  if (!/<gpx[\s>]/i.test(content)) {
    throw new RouteFileError("not-gpx", "El archivo no parece un GPX.");
  }

  const points: RoutePoint[] = [];

  for (const match of content.matchAll(TRACK_POINT)) {
    const attributes = match[2];
    const latitude = Number(LATITUDE.exec(attributes)?.[1]);
    const longitude = Number(LONGITUDE.exec(attributes)?.[1]);

    /* Un punto ilegible se salta en vez de tumbar el archivo entero: un GPX de 7.000 puntos con uno
       corrupto sigue siendo una ruta perfectamente utilizable. Si al final no quedan suficientes,
       lo dice el error de abajo. */
    if (!isUsableLatitude(latitude) || !isUsableLongitude(longitude)) continue;

    points.push({ latitude, longitude });
  }

  if (points.length < MIN_ROUTE_POINTS) {
    throw new RouteFileError(
      "too-few-points",
      "El archivo no trae un recorrido: hacen falta al menos dos puntos.",
    );
  }

  return {
    points: reducePoints(points),
    meters: routeLengthInMeters(points),
    originalPoints: points.length,
  };
}
