import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "~/infra/constants";

/**
 * Lo que no se rastrea, y por qué.
 *
 * - `/cuenta`, `/editar`, `/publicar`, `/admin`: dependen de la sesión. Para un rastreador, que
 *   nunca la tiene, son una redirección al login o un 404.
 * - `/auth`: pantallas de inicio de sesión.
 * - `/api`: no es contenido.
 * - `/buscar` y `/search`: resultados combinatorios. Indexarlos genera miles de páginas casi
 *   iguales que compiten contra las publicaciones que sí importan.
 *
 * Las publicaciones viven en la raíz (`/<slug>`), así que **no se puede bloquear por prefijo** sin
 * bloquear el contenido: la lista es explícita a propósito.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cuenta",
        "/editar/",
        "/publicar",
        "/admin/",
        "/api/",
        "/auth/",
        "/buscar",
        "/search",
      ],
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
