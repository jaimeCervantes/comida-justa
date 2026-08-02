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
