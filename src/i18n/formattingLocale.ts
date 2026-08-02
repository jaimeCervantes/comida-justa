import type { AppLocale } from "./routing";

/**
 * El idioma del sitio no basta para formatear cifras.
 *
 * `Intl` interpreta `"es"` a secas como español **de España**, y escribe `35,00 MXN`: coma
 * decimal, sin separador de miles y con el código de moneda en vez del símbolo. Para quien compra
 * en México eso se lee mal, y a primera vista parece otro precio. Con `es-MX` sale `$35.00`.
 *
 * Los locales del *routing* siguen siendo `es` y `en` a propósito, y no `es-MX`/`en-US`:
 * `post_translations.locale` y `category_translations.locale` guardan `'es'`/`'en'` en la base
 * compartida —con un CHECK—, así que regionalizarlos sería una migración en tres repositorios para
 * arreglar un separador decimal. Este mapa es la costura entre las dos cosas: idioma para el
 * contenido, región para las cifras.
 */
export const FORMATTING_LOCALE: Record<AppLocale, string> = {
  es: "es-MX",
  en: "en-US",
};
