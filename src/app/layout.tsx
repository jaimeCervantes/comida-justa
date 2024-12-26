import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import Header from "~/components/Header/Header";
import StoreProvider from '~/state/StoreProvider';
import Notification from '~/components/ui/Notification/Notification';

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

  // @TODO: implement a way to get the initial state from the server
  const initialState = {
    favorites: { items: [] },
    notifications: {
      items: [
        { id: 'add_favorite', title: "Favoritos", message: 'Agregado a favoritos', type: 'success', isOpened: false },
        { id: 'remove_favorite', title: "Favoritos", message: 'Eliminado de favoritos', type: 'error', isOpened: false }
      ],
      currentId: "",
      delay: 3000
    },
  };

  return (
    <html lang="es-MX">
      <body className={inter.className}>
        <StoreProvider initialState={initialState}>
          <Header />
          <main className="p-4">{children}</main>
          <Notification />
        </StoreProvider>
      </body>
    </html>
  );
}
