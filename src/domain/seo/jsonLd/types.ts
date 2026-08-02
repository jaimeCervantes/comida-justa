/**
 * Un nodo de JSON-LD ya armado, listo para serializar.
 *
 * Se queda en `Record<string, unknown>` a propósito: schema.org es un vocabulario abierto y tipar
 * cada propiedad aquí sería copiar un estándar entero para no ganar nada — lo que importa es que
 * cada constructor produzca exactamente lo que su prueba afirma.
 */
export type JsonLdNode = Record<string, unknown>;

export const SCHEMA_CONTEXT = "https://schema.org";

/** Quita las claves sin valor: una propiedad vacía en JSON-LD es peor que no declararla. */
export function withoutEmpty(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );
}
