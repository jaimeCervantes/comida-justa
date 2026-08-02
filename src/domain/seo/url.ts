/**
 * Une la base del sitio con una ruta absoluta del sitio.
 *
 * La base puede venir con barra final (`https://hazlosano.com/`) o sin ella según de qué variable
 * de entorno salga, y `${base}${path}` produciría `//productos` en el primer caso. Aquí se
 * normaliza una vez para que ningún llamador tenga que acordarse.
 */
export function absoluteUrl(baseUrl: string, path: string): string {
  const root = baseUrl.replace(/\/$/, "");

  return path === "/" ? `${root}/` : `${root}${path}`;
}

/**
 * Deja pasar lo que ya es una dirección completa y absolutiza lo demás.
 *
 * Las imágenes conviven en dos formas: las de la comunidad llegan con su host (Firebase, Google
 * Storage) y las del sitio son relativas (`/logo.webp`). En una etiqueta de Next da igual porque
 * `metadataBase` las resuelve, pero **en JSON-LD no hay quien las resuelva**: una `image` relativa
 * es una imagen que el buscador no puede pedir.
 */
export function ensureAbsoluteUrl(baseUrl: string, url: string): string {
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(baseUrl, url);
}
