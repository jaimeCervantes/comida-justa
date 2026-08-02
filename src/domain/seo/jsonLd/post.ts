import { type JsonLdNode, SCHEMA_CONTEXT, withoutEmpty } from "./types";

export const IN_STOCK = "https://schema.org/InStock";
export const OUT_OF_STOCK = "https://schema.org/OutOfStock";

export interface PostJsonLdInput {
  /** La canónica de la publicación; también identifica al nodo. */
  url: string;
  title: string;
  description: string;
  /** `producto` es lo que se vende; cualquier otra cosa se publica como artículo. */
  isProduct: boolean;
  price?: number | null;
  currency: string;
  isAvailable: boolean;
  publishedAt?: Date | null;
  authorName?: string | null;
  categoryLabel?: string | null;
  /** Ya absoluta: JSON-LD no tiene `metadataBase` que resuelva una relativa. */
  imageUrl?: string | null;
  videoUrl?: string | null;
  /**
   * El texto completo de la publicación, para el video.
   *
   * `description` es el recorte de 155 caracteres que cabe en un resultado de búsqueda; en JSON-LD
   * no hay tal límite, y en un video **el texto es lo único que se puede leer**. Recortarlo ahí
   * era tirar 1.300 caracteres de los que sí dicen de qué va el video.
   */
  longDescription?: string | null;
}

/**
 * Lo que un buscador —y un asistente— necesitan para saber **qué** es esta página.
 *
 * Un producto se declara `Product` con su `Offer`: precio, moneda y disponibilidad. Es la
 * diferencia entre aparecer como un texto y aparecer como una ficha con precio. Lo demás es
 * `Article`, que es lo que de verdad son los anuncios de salud.
 *
 * **El video va como nodo aparte.** 8 de las 24 publicaciones son video y su contenido entero está
 * ahí dentro: sin `VideoObject`, para un buscador esa página es un título y cuatro líneas. Su
 * miniatura es hoy la imagen de respaldo del sitio, porque no se guarda un fotograma del video
 * (pendiente anotado en la bitácora); el resto de los datos sí son suyos.
 */
export function buildPostJsonLd(input: PostJsonLdInput): JsonLdNode[] {
  const main = input.isProduct ? productNode(input) : articleNode(input);

  return input.videoUrl ? [main, videoNode(input)] : [main];
}

function productNode(input: PostJsonLdInput): JsonLdNode {
  return withoutEmpty({
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    name: input.title,
    description: input.description,
    image: input.imageUrl ?? undefined,
    url: input.url,
    category: input.categoryLabel ?? undefined,
    offers: offerNode(input),
  });
}

/** Sin precio no hay oferta que declarar: un `Offer` sin `price` es un dato inválido. */
function offerNode(input: PostJsonLdInput): JsonLdNode | undefined {
  if (input.price === null || input.price === undefined) return undefined;

  return withoutEmpty({
    "@type": "Offer",
    price: String(input.price),
    priceCurrency: input.currency,
    availability: input.isAvailable ? IN_STOCK : OUT_OF_STOCK,
    url: input.url,
    seller: personNode(input.authorName),
  });
}

function articleNode(input: PostJsonLdInput): JsonLdNode {
  return withoutEmpty({
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.imageUrl ?? undefined,
    url: input.url,
    datePublished: input.publishedAt?.toISOString(),
    author: personNode(input.authorName),
  });
}

function videoNode(input: PostJsonLdInput): JsonLdNode {
  return withoutEmpty({
    "@context": SCHEMA_CONTEXT,
    "@type": "VideoObject",
    name: input.title,
    description: input.longDescription || input.description,
    contentUrl: input.videoUrl ?? undefined,
    thumbnailUrl: input.imageUrl ?? undefined,
    uploadDate: input.publishedAt?.toISOString(),
  });
}

function personNode(name: string | null | undefined): JsonLdNode | undefined {
  return name ? { "@type": "Person", name } : undefined;
}
