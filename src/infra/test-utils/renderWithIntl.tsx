import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import messages from "~/i18n/messages/es.json";
import { type AppLocale, routing } from "~/i18n/routing";

/**
 * Renderiza dentro del contexto de next-intl.
 *
 * Cualquier componente que use `Link` o `useRouter` de `~/i18n/navigation` —o `useTranslations`—
 * necesita el provider: sin él, `useLocale()` lanza "No intl context found". En producción lo pone
 * `src/app/[locale]/layout.tsx` una sola vez; en pruebas lo pone esto.
 *
 * Se cargan los mensajes **reales** de `es.json`, no un catálogo de mentira: así una prueba falla
 * si alguien borra la clave que el componente pinta.
 */
export function renderWithIntl(
  ui: ReactElement,
  {
    locale = routing.defaultLocale,
    ...options
  }: RenderOptions & { locale?: AppLocale } = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
