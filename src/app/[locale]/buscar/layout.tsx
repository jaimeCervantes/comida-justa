import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOINDEX_METADATA } from "~/infra/UI/metadata/noindex";

/** Un layout solo para heredar el `noindex` a `/buscar` y a sus páginas de resultados. */
export const metadata: Metadata = NOINDEX_METADATA;

export default function BuscarLayout({ children }: { children: ReactNode }) {
  return children;
}
