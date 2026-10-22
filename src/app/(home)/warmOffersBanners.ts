import { routing } from "~/i18n/routing";
import {
  buildHomeOffersSlides,
  type HomeOffers,
  loadHomeOffers,
} from "./homeOffers";

/** Cuántas imágenes se piden a la vez: dibujar cuesta CPU, y el servidor también atiende visitas. */
const CONCURRENCY = 2;

type Dependencies = {
  load?: (locale: string) => Promise<HomeOffers>;
  fetcher?: (url: string) => Promise<unknown>;
};

/**
 * Las direcciones de todas las imágenes del carrusel, en todos los idiomas y formatos: las mismas
 * que pide la portada, porque salen de la misma función (`buildHomeOffersSlides`).
 */
export async function offersBannerUrls(
  load: (locale: string) => Promise<HomeOffers> = loadHomeOffers,
): Promise<string[]> {
  const urls = await Promise.all(
    routing.locales.map(async (locale) =>
      buildHomeOffersSlides(await load(locale), locale, {
        alt: () => "",
        item: () => "",
      }).flatMap((slide) => [slide.images.ancho, slide.images.compacto]),
    ),
  );

  return urls.flat();
}

/**
 * Pide las imágenes del carrusel **antes** de que llegue el primer visitante, para que las
 * encuentre ya dibujadas.
 *
 * Se llama después de guardar una publicación que se vende (`after()` en publicar y editar): es
 * cuando puede haber cambiado una promoción, y con ella la dirección de alguna imagen. Una dirección
 * que ya estaba dibujada responde de la caché sin costo, así que pedirlas todas es barato.
 *
 * Va **por HTTP a la propia ruta** y no llamando a la función que dibuja: en producción la acción y
 * la ruta pueden correr en procesos distintos, y solo pidiéndola se llena la caché de la ruta y la de
 * la CDN. `origin` es el de la petición que guardó, así que en local o en un e2e calienta ese
 * servidor y nunca el de producción.
 *
 * Nunca falla: un banner sin calentar se dibuja igual cuando alguien lo pide.
 */
export async function warmOffersBanners(
  origin: string,
  { load = loadHomeOffers, fetcher = fetch }: Dependencies = {},
): Promise<number> {
  let urls: string[];

  try {
    urls = await offersBannerUrls(load);
  } catch {
    return 0;
  }

  let warmed = 0;
  const queue = [...urls];
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        await fetcher(`${origin}${url}`);
        warmed++;
      } catch {
        /* Se dibuja cuando alguien la pida. */
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return warmed;
}
