/**
 * La dirección pública de una persona.
 *
 * Vive bajo `/u/` por lo mismo que las tiendas bajo `/tienda/`: la raíz ya es de las
 * publicaciones. Al ser namespaces separados, una persona y una tienda pueden llamarse igual sin
 * taparse — `hazlosano.com/u/hazlo-sano` y `hazlosano.com/tienda/hazlo-sano` conviven.
 */
export const PROFILE_BASE_PATH = "/u";

export function profilePath(username: string): string {
  return `${PROFILE_BASE_PATH}/${username}`;
}
