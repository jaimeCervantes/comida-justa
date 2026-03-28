import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "~/infra/UI/components/Header/Header";
import Footer from "~/infra/UI/components/Footer/Footer";
import "~/app/styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header locale={locale} />
          <main className="flex-1 pt-4 pb-12">
            <div className="container-width">{children}</div>
          </main>
          <Footer />
        </div>
      </body>
      {process.env.NODE_ENV === "production" && gaId && (
        <GoogleAnalytics gaId={gaId} />
      )}
    </html>
  );
}
