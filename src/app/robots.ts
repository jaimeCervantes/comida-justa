import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "~/infra/constants";

/**
 * Lo que no se rastrea, y por qué.
 *
 * - `/cuenta`, `/editar`, `/publicar`, `/admin`: dependen de la sesión. Para un rastreador, que
 *   nunca la tiene, son una redirección al login o un 404.
 * - `/auth`: pantallas de inicio de sesión.
 * - `/api`: no es contenido.
 * - `/buscar`: resultados combinatorios. Indexarlos genera miles de páginas casi iguales que
 *   compiten contra las publicaciones que sí importan.
 *
 * Las publicaciones viven en la raíz (`/<slug>`), así que **no se puede bloquear por prefijo** sin
 * bloquear el contenido: la lista es explícita a propósito.
 *
 * **Cada ruta va en sus dos idiomas.** Desde que `routing.ts` declara `pathnames`, lo privado
 * también existe en inglés y con otro nombre: bloquear solo `/cuenta` dejaría `/en/account`
 * abierto de par en par. Es la clase de hueco que no se nota hasta que aparece indexado.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cuenta",
        "/en/account",
        "/editar/",
        "/en/edit/",
        "/publicar",
        "/en/publish",
        "/admin/",
        "/en/admin/",
        "/api/",
        "/auth/",
        "/en/auth/",
        "/buscar",
        "/en/search",
      ],
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
