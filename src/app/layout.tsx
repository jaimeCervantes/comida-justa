import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "~/infrastructure/components/Header/Header";
import "./styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comida Justa",
  description:
    "¿Como evitar enfermedades, ahorrar tiempo y dinero, al mismo tiempo que apoyas al medio ambiente y a tu comunidad?",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang="es-MX">
      <body className={inter.className}>
        <Header />
        <main className="p-4">{children}</main>
      </body>
      {process.env.NODE_ENV === 'production' && gaId && (
        <GoogleAnalytics gaId={gaId} />
      )}
    </html>
  );
}
