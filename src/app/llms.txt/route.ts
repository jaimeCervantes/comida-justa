import { getTranslations } from "next-intl/server";
import { buildLlmsTxt } from "~/domain/seo/llmsTxt";
import { STATIC_SITEMAP_PATHS } from "~/domain/seo/sitemap";
import { routing } from "~/i18n/routing";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
import {
  getDirectory,
  getLatestPosts,
} from "~/infra/dataAccess/seo/PostgresFeedRepository";

/** Cuántas publicaciones entran al índice. Las 24 de hoy caben de sobra. */
const INDEX_SIZE = 100;

export const dynamic = "force-dynamic";

/**
 * El índice del sitio para asistentes, en `/llms.txt`.
 *
 * Se sirve como texto plano para que se pueda leer de un `curl` sin descargar nada. Sale de la
 * base en cada petición, igual que el sitemap: un índice que nace desactualizado no sirve de nada.
 *
 * **Va en español**, el idioma por defecto. Desde el backfill de traducciones el contenido existe
 * también en inglés, así que esto pasó de ser una consecuencia a ser una decisión: un índice es
 * para orientarse, y duplicar cada entrada en dos idiomas lo hace el doble de largo sin añadir un
 * destino nuevo — el sitio ya declara sus `hreflang` y el sitemap lista las dos direcciones.
 */
export async function GET(): Promise<Response> {
  const locale = routing.defaultLocale;
  const [posts, directory, t] = await Promise.all([
    getLatestPosts(INDEX_SIZE),
    getDirectory(),
    getTranslations({ locale }),
  ]);

  /**
   * El nombre de cada página fija sale del **mismo catálogo** que ve un visitante: el índice no
   * puede decir una cosa distinta de la que dice el sitio. Una página nueva en
   * `STATIC_SITEMAP_PATHS` sin nombre aquí sale con su ruta, no con un hueco.
   */
  const staticTitles: Record<string, string> = {
    "/": t("common.home"),
    "/productos": t("products.title"),
    "/eventos": t("events.title"),
    "/nosotros": t("nav.about"),
    "/pilares": t("nav.pillarsMenu"),
    "/pilares/sueno": t("pillars.sleep.title"),
    "/pilares/alimentacion": t("pillars.nutrition.title"),
    "/pilares/movimiento": t("pillars.movement.title"),
    "/pilares/mente-espiritu": t("pillars.mindSpirit.title"),
    "/politica-de-privacidad": t("privacyPolicy.title"),
    "/condiciones-de-servicio": t("termsOfService.title"),
  };

  const body = buildLlmsTxt({
    baseUrl: CANONICAL_URL,
    brandName: PUBLIC_BRAND_NAME,
    description: t("feed.llmsDescription"),
    sections: [
      {
        heading: t("nav.communitySections"),
        entries: STATIC_SITEMAP_PATHS.map((path) => ({
          title: staticTitles[path] ?? path,
          path,
        })),
      },
      {
        heading: t("nav.publications"),
        entries: posts.map((post) => ({
          title: post.title,
          path: `/${post.slug}`,
          summary: post.content,
        })),
      },
      { heading: t("feed.llmsStores"), entries: directory.stores },
      { heading: t("feed.llmsProfiles"), entries: directory.profiles },
    ],
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
