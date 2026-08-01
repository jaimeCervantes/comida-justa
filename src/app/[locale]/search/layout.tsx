import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOINDEX_METADATA } from "~/infra/UI/metadata/noindex";

/** Un layout solo para heredar el `noindex` a `/search` y a sus páginas de resultados. */
export const metadata: Metadata = NOINDEX_METADATA;

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
