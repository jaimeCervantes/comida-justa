import type { MetadataRoute } from "next";
import { buildSitemap } from "~/domain/seo/sitemap";
import { CANONICAL_URL } from "~/infra/constants";
import { getSitemapContent } from "~/infra/dataAccess/seo/PostgresSitemapRepository";

/**
 * Se genera en cada petición y no en el build.
 *
 * El sitemap tiene que reflejar lo que hay **ahora**: una publicación nueva no puede esperar al
 * siguiente despliegue para ser descubrible. Un rastreador pide esto unas pocas veces al día, así
 * que las tres consultas que cuesta son irrelevantes frente a publicar contenido invisible.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(CANONICAL_URL, await getSitemapContent());
}
