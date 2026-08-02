import { type JsonLdNode, SCHEMA_CONTEXT, withoutEmpty } from "./types";

export interface BranchJsonLdInput {
  name: string;
  address: string;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StoreJsonLdInput {
  url: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  /** Ya absoluta. */
  logoUrl?: string | null;
  /** El sitio propio del vendedor, si tiene: es lo que consolida su identidad. */
  website?: string | null;
  branches: readonly BranchJsonLdInput[];
}

/**
 * La tienda como negocio local, con dónde está.
 *
 * `geo` es lo que convierte "una tienda" en "una tienda **en Tezonapa**", que es justo la búsqueda
 * que puede traer un cliente a pie. Las coordenadas ya las guarda la sucursal —el chatbot las usa
 * para el radio de cercanía—, así que aquí solo se publican.
 *
 * **La primera sucursal manda** en `address` y `geo`, y las demás se declaran como `location`. Es
 * la forma que aguanta las dos realidades: hoy hay una sola sucursal, y el día que haya tres
 * ninguna se pierde.
 */
export function buildStoreJsonLd(input: StoreJsonLdInput): JsonLdNode {
  const [main, ...others] = input.branches;

  return withoutEmpty({
    "@context": SCHEMA_CONTEXT,
    "@type": "LocalBusiness",
    name: input.name,
    url: input.url,
    description: input.description ?? undefined,
    telephone: input.phone ?? undefined,
    image: input.logoUrl ?? undefined,
    logo: input.logoUrl ?? undefined,
    sameAs: input.website ? [input.website] : undefined,
    address: main ? postalAddress(main) : undefined,
    geo: main ? geoCoordinates(main) : undefined,
    hasMap: main?.mapUrl ?? undefined,
    location: others.map(placeNode),
  });
}

function placeNode(branch: BranchJsonLdInput): JsonLdNode {
  return withoutEmpty({
    "@type": "Place",
    name: branch.name,
    address: postalAddress(branch),
    geo: geoCoordinates(branch),
    hasMap: branch.mapUrl ?? undefined,
  });
}

/**
 * La dirección se guarda como una sola línea que escribió el vendedor. Se publica tal cual en
 * `streetAddress` en vez de partirla con heurísticas: una calle mal adivinada es peor que una
 * dirección completa en un solo campo.
 */
function postalAddress(branch: BranchJsonLdInput): JsonLdNode {
  return { "@type": "PostalAddress", streetAddress: branch.address };
}

function geoCoordinates(branch: BranchJsonLdInput): JsonLdNode | undefined {
  if (
    branch.latitude === null ||
    branch.latitude === undefined ||
    branch.longitude === null ||
    branch.longitude === undefined
  ) {
    return undefined;
  }

  return {
    "@type": "GeoCoordinates",
    latitude: branch.latitude,
    longitude: branch.longitude,
  };
}
