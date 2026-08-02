import { type JsonLdNode, SCHEMA_CONTEXT, withoutEmpty } from "./types";

export interface SiteJsonLdInput {
  siteUrl: string;
  brandName: string;
  /** Ya absoluta. */
  logoUrl: string;
  description?: string | null;
  /** Los perfiles públicos de la marca: es lo que consolida la entidad. */
  sameAs?: readonly string[];
  inLanguage: string;
}

export interface ProfileJsonLdInput {
  url: string;
  name: string;
  imageUrl?: string | null;
}

/**
 * Quién publica el sitio.
 *
 * `sameAs` es la parte que hace trabajo de verdad: le dice al buscador —y a un asistente— que la
 * cuenta de TikTok, la de Facebook y este dominio son **la misma** Hazlo Sano, en vez de tres
 * nombres parecidos. Los dos nodos se referencian por `@id` para que el sitio y su editor no
 * parezcan entidades sueltas.
 */
export function buildSiteJsonLd(input: SiteJsonLdInput): JsonLdNode[] {
  const organizationId = `${input.siteUrl}#organization`;

  return [
    withoutEmpty({
      "@context": SCHEMA_CONTEXT,
      "@type": "Organization",
      "@id": organizationId,
      name: input.brandName,
      url: input.siteUrl,
      logo: input.logoUrl,
      description: input.description ?? undefined,
      sameAs: input.sameAs ?? undefined,
    }),
    withoutEmpty({
      "@context": SCHEMA_CONTEXT,
      "@type": "WebSite",
      "@id": `${input.siteUrl}#website`,
      name: input.brandName,
      url: input.siteUrl,
      inLanguage: input.inLanguage,
      publisher: { "@id": organizationId },
    }),
  ];
}

/** Un perfil de la comunidad: quién es y dónde vive su página. */
export function buildProfileJsonLd(input: ProfileJsonLdInput): JsonLdNode {
  return withoutEmpty({
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: input.name,
    url: input.url,
    image: input.imageUrl ?? undefined,
  });
}
