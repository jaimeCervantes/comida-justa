import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import Footer from "~/presentation/chrome/Footer/Footer";
import Header from "~/presentation/chrome/Header/Header";
import "~/app/styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "~/i18n/routing";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { readVisitorFix } from "~/infra/location/visitorLocation";
import { readThemePreference } from "~/infra/theme/readThemePreference";
import BottomNav from "~/presentation/chrome/BottomNav/BottomNav";
import NearbyBar from "~/presentation/chrome/NearbyBar/NearbyBar";
import SiteCelebrationMessage from "~/presentation/chrome/SiteMessage/SiteCelebrationMessage";
import LocationRefresher from "~/presentation/location/LocationRefresher";

/**
 * Las dos voces del sistema, servidas desde nuestro dominio.
 *
 * `next/font` descarga los archivos en build y los sirve como propios: el visitante no le pide
 * nada a un servidor de fuentes ajeno, no hay una petición extra que bloquee el pintado, y no hay
 * salto de fuente cuando llega la real.
 *
 * Se exponen como `variable` y no con `className` porque son **dos**: el layout no puede aplicar
 * las dos familias a la vez, así que planta las dos custom properties en `<html>` y deja que
 * `typography.css` decida cuál usa cada cosa. Los nombres coinciden con los que ese archivo espera.
 *
 * `display: "swap"` enseña la cadena de reserva mientras la fuente viaja: en una conexión lenta,
 * texto legible enseguida vale más que la tipografía correcta tres segundos después.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  /* Óptico y peso variables: una sola descarga cubre de 300 a 800 y los titulares grandes. */
  axes: ["opsz"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

/**
 * Sin esto, `[locale]` se resuelve en cada petición y ninguna ruta se prerenderiza. Declarar los
 * idiomas es lo que permite que `setRequestLocale` en cada página tenga efecto.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  /**
   * Con esto, cualquier imagen o canónico relativo de una página hija se resuelve contra el
   * dominio real. Sin él, Next avisa y las URL de Open Graph salen relativas, que es como no
   * tenerlas: quien comparte el enlace no ve la imagen.
   */
  metadataBase: new URL(CANONICAL_URL),
  title: PUBLIC_BRAND_NAME,
  description:
    "¿Como evitar enfermedades, ahorrar tiempo y dinero, al mismo tiempo que apoyas al medio ambiente y a tu comunidad?",
  /**
   * Sin `max-image-preview: large`, Google enseña las publicaciones con una miniatura del tamaño
   * de un sello: en un sitio donde lo que se vende entra por la foto, eso es regalar el clic. Los
   * otros dos quitan los topes de fragmento y de vista previa de video, que son los formatos de
   * los 8 anuncios en video.
   *
   * Lo heredan todas las páginas; las que piden `noindex` declaran su propio `robots` y este no
   * las alcanza (ver `NOINDEX_METADATA`).
   */
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  /* El segmento acepta cualquier cosa, así que un idioma que no existe llega hasta aquí. Se
     responde 404 en vez de servir español en una dirección inventada: dos URL con el mismo
     contenido es justo lo que `docs/features/content/003-2026-08-01-seo.md` evita. */
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const themePreference = await readThemePreference();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      // Sin preferencia guardada, ningún atributo: `colors.css` ya sigue al sistema por su cuenta.
      // Puesto aquí y no por un script en el cliente, `<html>` nace en el tema correcto desde el
      // primer byte — no hay "flash of wrong theme" que corregir después de pintar.
      data-theme={themePreference ?? undefined}
      className={`${newsreader.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Sin el provider, un Client Component que use `useTranslations` revienta. Va aquí una
            sola vez para que el slice 1 pueda extraer texto en cualquier hoja del árbol. */}
        <NextIntlClientProvider>
          {/* No pinta nada: vuelve a detectar dónde está quien mira cuando ya nos dio permiso, para
              que las distancias sigan siendo ciertas después de moverse. Va aquí, y no en cada
              página, para correr una vez por carga completa en lugar de por navegación. */}
          <LocationRefresher fix={await readVisitorFix()} />
          <div className="flex flex-col min-h-screen">
            <Header />
            {/* Desde dónde se miden las distancias, y cómo corregirlo. Va aquí y no dentro del
                header —que es `sticky`— para no clavar una tercera fila en el teléfono; y va aquí y
                no en cada página porque esa era justo la deuda: seis páginas lo montaban y la de
                entrada se había quedado sin él. */}
            <NearbyBar />
            <SiteCelebrationMessage />
            {/* `pb-28` en el teléfono: la barra inferior es `fixed`, así que sin hueco propio
                taparía el final de cada página. Desde `lg` desaparece y el relleno vuelve al de
                siempre. */}
            <main className="flex-1 pt-4 pb-28 lg:pb-12">
              <div className="container-width">{children}</div>
            </main>
            <Footer theme={themePreference} />

            {/* Las cinco cosas que se hacen aquí, al alcance del pulgar. Solo por debajo de `lg`,
                que es donde la barra de escritorio se esconde: nunca se ven las dos. */}
            <BottomNav />
          </div>
        </NextIntlClientProvider>
      </body>
      {process.env.NODE_ENV === "production" && gaId && (
        <GoogleAnalytics gaId={gaId} />
      )}
    </html>
  );
}
