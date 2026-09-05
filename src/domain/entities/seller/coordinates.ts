export interface Coordinates {
  latitude: number;
  longitude: number;
}

const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

/** Hosts con los que Google acorta un enlace: no llevan coordenadas, hay que seguir el redirect. */
const SHORT_MAP_HOSTS = ["maps.app.goo.gl", "goo.gl"];

/**
 * De dónde se sacan las coordenadas, en orden de confianza.
 *
 * `!3d…!4d…` gana sobre `@…`: el primero es **el punto del lugar** y el segundo es el centro del
 * mapa que el usuario tenía en pantalla al copiar. Cuando alguien busca su negocio y arrastra un
 * poco el mapa antes de copiar, los dos difieren, y el que sirve para que lo encuentren es el pin.
 */
const COORDINATE_PATTERNS: readonly RegExp[] = [
  /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
  /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  /[?&](?:q|query|ll|daddr|destination)=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
  /^\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*$/,
];

export function areValidCoordinates(value: Coordinates | null): boolean {
  if (!value) return false;

  const { latitude, longitude } = value;

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= LATITUDE_LIMIT &&
    Math.abs(longitude) <= LONGITUDE_LIMIT &&
    // 0,0 es el Golfo de Guinea: en la práctica significa "no se pudo leer nada".
    !(latitude === 0 && longitude === 0)
  );
}

/**
 * ¿Es uno de los enlaces cortos que reparte el botón "Compartir" de Google Maps?
 *
 * Importa porque **es el que la gente pega**: la única sucursal que existe hoy en la base guarda
 * `https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6`. Un enlace corto no contiene coordenadas; hay que
 * seguirlo primero.
 */
export function isShortMapUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const { hostname } = new URL(url);

    return SHORT_MAP_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

/** Las coordenadas que lleve el enlace, o `null` si no se puede leer ninguna. */
export function parseCoordinatesFromMapUrl(
  url: string | null | undefined,
): Coordinates | null {
  if (!url) return null;

  const decoded = safeDecode(url);

  for (const pattern of COORDINATE_PATTERNS) {
    const match = decoded.match(pattern);

    if (!match) continue;

    const parsed = {
      latitude: Number(match[1]),
      longitude: Number(match[2]),
    };

    if (areValidCoordinates(parsed)) return parsed;
  }

  return null;
}

/**
 * La dirección de Google Maps que enseña **este punto exacto**.
 *
 * Es el reverso de `parseCoordinatesFromMapUrl`: aquella lee coordenadas de una dirección, esta
 * escribe una dirección desde coordenadas. Vive aquí por eso, y porque este archivo ya es el que
 * conoce el formato de Google.
 *
 * **Existe para poder comprobar lo que se guardó, no para navegar.** Lo que la lista de sucursales
 * enseña como «Ver en el mapa» es el enlace que pegó el vendedor, y ese siempre le parece correcto
 * porque es el suyo; lo que decide si aparece en las búsquedas por cercanía es `branches.location`,
 * que hasta ahora no se veía en ninguna pantalla. Cuando el enlace pegado solo traía el `@` del
 * encuadre, las dos cosas pueden estar a cientos de metros y nadie se enteraba.
 *
 * Devuelve `null` con coordenadas que no valen, en vez de una dirección que lleva al Golfo de
 * Guinea.
 */
export function mapPointUrl(value: Coordinates | null): string | null {
  if (!areValidCoordinates(value)) return null;

  const { latitude, longitude } = value as Coordinates;

  /* `?q=lat,lng` y no `?ll=` ni `/@`: es la forma que Google documenta para «enseña este punto», la
     que entienden también las aplicaciones de móvil, y la única que deja caer un pin en un sitio
     sin nombre — que es justo el caso que se quiere ver cuando el punto está mal. */
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/** Un enlace copiado a mano puede traer `%2C` en vez de coma, o venir mal codificado. */
function safeDecode(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}
