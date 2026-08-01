import type messages from "./messages/es.json";
import type { routing } from "./routing";

/**
 * Liga los tipos de next-intl a la lista de idiomas y al catálogo de este proyecto, de modo que
 * `t("no.existe")` y un idioma desconocido sean errores de compilación en vez de un texto que
 * falta descubierto en producción.
 *
 * `es.json` es el catálogo de referencia: `en.json` tiene que quedarse estructuralmente idéntico,
 * y `pnpm typecheck` es lo que lo obliga. Es lo que hace auditable sacar el español de ~95
 * archivos: "¿me faltó una clave?" pasa a contestarlo el compilador.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
