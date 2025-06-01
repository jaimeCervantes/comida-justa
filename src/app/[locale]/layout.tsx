import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "~/infrastructure/UI/components/Header/Header";
import "~/app/styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comida Justa",
  description:
    "¿Como evitar enfermedades, ahorrar tiempo y dinero, al mismo tiempo que apoyas al medio ambiente y a tu comunidad?",
};


export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Header locale={locale} />
        <main className="p-4">{children}</main>
      </body>
      {process.env.NODE_ENV === 'production' && gaId && (
        <GoogleAnalytics gaId={gaId} />
      )}
    </html>
  );
}
