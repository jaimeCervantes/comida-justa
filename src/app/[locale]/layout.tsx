import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import Footer from "~/infra/UI/components/Footer/Footer";
import Header from "~/infra/UI/components/Header/Header";
import "~/app/styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "~/i18n/routing";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";

const inter = Inter({ subsets: ["latin"] });

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
     contenido es justo lo que `docs/features/seo.md` evita. */
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={inter.className}>
        {/* Sin el provider, un Client Component que use `useTranslations` revienta. Va aquí una
            sola vez para que el slice 1 pueda extraer texto en cualquier hoja del árbol. */}
        <NextIntlClientProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-4 pb-12">
              <div className="container-width">{children}</div>
            </main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
      {process.env.NODE_ENV === "production" && gaId && (
        <GoogleAnalytics gaId={gaId} />
      )}
    </html>
  );
}
