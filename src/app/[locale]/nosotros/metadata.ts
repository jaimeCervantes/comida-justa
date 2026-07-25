import type { Metadata } from "next";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";

export const ABOUT_TITLE = `Qué es ${PUBLIC_BRAND_NAME}`;

export const ABOUT_SUBTITLE = `Un ecosistema de vida sana: 4 pilares, chatbot y productos naturales`;

export const ABOUT_DESCRIPTION = `${PUBLIC_BRAND_NAME} es un ecosistema de vida sana construido sobre 4 pilares: sueño, alimentación natural, movimiento y mente. Conoce nuestro chatbot y nuestros productos naturales.`;

/** Metadata de la página de marca; el canónico vive en `/nosotros`, sin prefijo de locale. */
export function buildAboutMetadata(): Metadata {
  const title = `${ABOUT_TITLE} - Ecosistema de vida sana`;

  return {
    title,
    description: ABOUT_DESCRIPTION,
    openGraph: {
      title,
      description: ABOUT_DESCRIPTION,
      images: ["https://hazlosano.com/logo.webp"],
      type: "website",
    },
    alternates: {
      canonical: `${CANONICAL_URL}/nosotros`,
    },
  };
}
