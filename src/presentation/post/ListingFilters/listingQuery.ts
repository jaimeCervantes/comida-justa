export type QueryValue = string | number | null | undefined;

/**
 * La dirección de un listado con algunos parámetros cambiados.
 *
 * Es lo que hace que cambiar un filtro no suelte otro: se parte de todo lo que ya llevaba la
 * dirección y solo se pisa lo que cambia. `page` se cae siempre —con otro filtro, otra cuenta, y la
 * página 3 de antes puede no existir—, y un valor vacío o nulo quita el parámetro en vez de dejar
 * `?pillar=` colgando.
 */
export function listingQuery(
  current: Readonly<Record<string, QueryValue>> | undefined,
  changes: Readonly<Record<string, QueryValue>> = {},
): Record<string, string> | undefined {
  const next = new Map<string, string>();

  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (key === "page" || value === null || value === undefined) continue;
    if (value === "") continue;
    next.set(key, String(value));
  }

  return next.size > 0 ? Object.fromEntries(next) : undefined;
}
