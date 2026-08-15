import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import { type AppLocale, routing } from "~/i18n/routing";

/**
 * Renderiza dentro del contexto de next-intl.
 *
 * Cualquier componente que use `Link` o `useRouter` de `~/i18n/navigation` —o `useTranslations`—
 * necesita el provider: sin él, `useLocale()` lanza "No intl context found". En producción lo pone
 * `src/app/[locale]/layout.tsx` una sola vez; en pruebas lo pone esto.
 *
 * Se cargan los catálogos **reales**, no uno de mentira: así una prueba falla si alguien borra la
 * clave que el componente pinta. Y se carga **el del idioma pedido**, porque si no, un caso
 * `locale: "en"` seguiría leyendo español y afirmaría algo falso.
 */
const CATALOGS = { es, en } satisfies Record<AppLocale, unknown>;

export function renderWithIntl(
  ui: ReactElement,
  {
    locale = routing.defaultLocale,
    ...options
  }: RenderOptions & { locale?: AppLocale } = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={CATALOGS[locale]}
        /* La misma que fija `i18n/request.ts` en producción. Sin ella, `format.dateTime` avisa por
           consola y formatea en la zona de la máquina: una fecha afirmada en una prueba pasaría en
           local y fallaría en CI, que corre en otra. Se copia el valor y no se importa porque
           `request.ts` es un `getRequestConfig`, que no se puede evaluar fuera de una petición. */
        timeZone="America/Mexico_City"
      >
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
