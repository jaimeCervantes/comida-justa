/**
 * Los dos directorios de la comunidad y qué significa cada uno.
 *
 * La distinción costó una vuelta y conviene dejarla escrita: **`origin` describe la publicación, no
 * al vendedor**. Un restaurante del pueblo cocina lo que vende y publicaría `productor`; una tienda
 * de abarrotes revende producto de fuera y publicaría `reventa_lejana`. Los dos son negocios del
 * pueblo. Por eso:
 *
 * - **Negocios locales** son *todas* las tiendas: quien abrió tienda aquí, venda lo que venda.
 * - **Productores locales** son las que además publican algo con `productor` **y están dentro del
 *   radio sostenible** (`proximity.ts`), o sea las que **hacen** lo que venden, aquí. Es un
 *   subconjunto, y está bien que lo sea.
 *
 * Lo local no se declara: la publicación dice el rol y la sucursal dice la distancia. Un productor
 * sin sucursal no entra, porque no hay nada que verificar.
 */
export const DIRECTORY_KINDS = ["businesses", "producers"] as const;

export type DirectoryKind = (typeof DIRECTORY_KINDS)[number];

export interface StoreSummary {
  handle: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  /** Cuántas publicaciones tiene: es lo que distingue una tienda viva de una recién abierta. */
  publicationCount: number;
}

export interface DirectoryPage {
  stores: StoreSummary[];
  total: number;
  totalPages: number;
}

/** ¿Este directorio se limita a quien produce? */
export function onlyProducers(kind: DirectoryKind): boolean {
  return kind === "producers";
}
