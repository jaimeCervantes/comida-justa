import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOINDEX_METADATA } from "~/infra/UI/metadata/noindex";

/**
 * `/auth/signin` es un Client Component y no puede exportar `metadata`; este layout se lo pone
 * a toda la sección.
 */
export const metadata: Metadata = NOINDEX_METADATA;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
