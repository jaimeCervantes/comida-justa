import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";

type GenerateSeoInput = {
  title: string;
  description: string;
  mediaUrl?: string;
  url?: string;
};

type GenerateSeoOutput = {
  title: string;
  metas: {
    content: string;
    name?: string;
    property?: string;
  }[];
};

export function generateSeo({
  title,
  description,
  mediaUrl = "",
  url = "",
}: GenerateSeoInput): GenerateSeoOutput {
  const trimedDescription = description.trim();
  const shortDescription =
    trimedDescription.length > 160
      ? trimedDescription.slice(0, 160).trim()
      : trimedDescription;

  const titleKeywords = title.toLowerCase().split(" ").filter(Boolean);
  const descriptionKeywords = shortDescription
    .toLowerCase()
    .split(" ")
    .filter(Boolean);

  const allKeywords = new Set([...titleKeywords, ...descriptionKeywords]);
  const keywords = Array.from(allKeywords).join(", ");

  // Crear descripción más corta para redes sociales
  const socialDescription =
    trimedDescription.length > 100
      ? trimedDescription.slice(0, 100).trim() + "..."
      : trimedDescription;

  return {
    title: `${title} | ${PUBLIC_BRAND_NAME}`,
    metas: [
      // Meta tags básicas
      {
        content: keywords,
        name: "keywords",
      },
      {
        content: mediaUrl,
        name: "image",
      },
      {
        content: shortDescription,
        name: "description",
      },

      // Open Graph meta tags
      {
        content: title,
        property: "og:title",
      },
      {
        content: socialDescription,
        property: "og:description",
      },
      {
        content: mediaUrl,
        property: "og:image",
      },
      {
        content: url,
        property: "og:url",
      },
      {
        content: "website",
        property: "og:type",
      },

      // Twitter Card meta tags
      {
        content: "summary_large_image",
        name: "twitter:card",
      },
      {
        content: title,
        name: "twitter:title",
      },
      {
        content: socialDescription,
        name: "twitter:description",
      },
      {
        content: mediaUrl,
        name: "twitter:image",
      },
      {
        content: CANONICAL_URL,
        name: "twitter:domain",
      },
    ],
  };
}
