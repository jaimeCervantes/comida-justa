import { type JsonLdNode, SCHEMA_CONTEXT } from "./types";

export interface BreadcrumbItem {
  name: string;
  /** La dirección absoluta del paso. El último paso —la página actual— puede no tenerla. */
  url?: string;
}

/**
 * La miga de pan que lee el buscador.
 *
 * **Solo se declara si la página la enseña.** Google pide que los datos estructurados reflejen lo
 * que la página muestra, y por eso este constructor llegó con la miga visible y no antes: marcado
 * sin respaldo es marcado que te pueden penalizar.
 *
 * La posición es 1-indexada y va en el orden del camino, del inicio a la página actual.
 */
export function buildBreadcrumbJsonLd(
  items: readonly BreadcrumbItem[],
): JsonLdNode | null {
  // Una miga de un solo paso no dice nada que la propia URL no diga.
  if (items.length < 2) return null;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}
