import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "~/domain/seo/aiCrawlers";
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
const PRIVATE_PATHS: readonly string[] = [
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
];

/**
 * El permiso es explícito, no heredado.
 *
 * Un rastreador que encuentra **su propio nombre** en `robots.txt` ignora por completo el grupo
 * `*`: así lo dice el estándar y así lo aplican todos. Por eso la lista de rutas privadas se
 * repite en los dos grupos desde una sola constante — declarar los agentes de IA y olvidar el
 * `Disallow` les abriría `/cuenta` de par en par.
 *
 * **Se les permite el contenido a propósito.** Que un asistente conteste "¿dónde compro pan de
 * masa madre en Tezonapa?" citando la tienda es exactamente para lo que existe este sitio; no
 * aparecer ahí no protege nada, solo hace que respondan con otro.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_PATHS],
      },
      {
        userAgent: [...AI_CRAWLERS],
        allow: "/",
        disallow: [...PRIVATE_PATHS],
      },
    ],
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
