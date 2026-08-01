import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./routing";

/**
 * Resuelve el idioma de la petición y carga su catálogo.
 *
 * El segmento `[locale]` se comporta como un comodín, así que aquí puede llegar un valor
 * desconocido (`/fr/productos`). Caer al idioma por omisión mantiene la página renderizable en vez
 * de reventar durante la resolución del layout.
 *
 * Hay **un catálogo por idioma**, con los namespaces como claves de primer nivel: agregar un
 * namespace es editar el JSON, no este archivo.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(await requestLocale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
