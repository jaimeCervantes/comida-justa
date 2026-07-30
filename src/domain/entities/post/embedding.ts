/**
 * Qué texto se vectoriza y con cuántas dimensiones.
 *
 * El chatbot ya guardó 9 vectores en `post_translations.embedding` construidos por su propio
 * dominio (`app/use_cases/products.py::_build_embedding_text`). Para que lo publicado desde el
 * sitio compita en el mismo espacio, aquí se replica **la misma composición**: mismas etiquetas
 * en español, mismo orden, mismo separador. No es cosmético — el texto es la entrada del modelo.
 *
 * Las 768 dimensiones no son un detalle de infraestructura: la columna `vector(768)` rechaza
 * cualquier otro tamaño, así que el caso de uso las valida antes de intentar guardar.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Lo que se vectoriza de una publicación, en el idioma de su traducción.
 *
 * `category`/`subCategory` llegan como **etiqueta legible** ("Alimentación", "Jugos"), no como
 * la clave de la allowlist: es lo que leyó el modelo cuando indexó el catálogo del chatbot.
 */
export type PostEmbeddingSource = {
  title: string;
  category?: string | null;
  subCategory?: string | null;
  content?: string | null;
  tags?: readonly string[] | null;
  price?: number | null;
};

/** Comillas y espacios heredados del catálogo viejo, donde los tags venían como `"jugo"`. */
function normalizeTags(tags: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) =>
      typeof tag === "string" ? tag.replace(/["']/g, "").trim() : "",
    )
    .filter((tag) => tag.length > 0);
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Arma el documento que se le manda al modelo de embeddings. Los campos ausentes se omiten en
 * vez de escribirse vacíos: una línea "Descripción:" sin contenido es ruido que el vector
 * termina representando.
 */
export function buildEmbeddingText(source: PostEmbeddingSource): string {
  const parts: string[] = [`Nombre: ${source.title.trim()}`];

  if (source.category) parts.push(`Categoría: ${source.category}`);
  if (source.subCategory) parts.push(`Sub-categoría: ${source.subCategory}`);
  if (source.content?.trim())
    parts.push(`Descripción: ${source.content.trim()}`);

  const tags = normalizeTags(source.tags);
  if (tags.length > 0) parts.push(`Etiquetas: ${tags.join(", ")}`);

  if (typeof source.price === "number" && Number.isFinite(source.price)) {
    parts.push(`Precio: ${formatPrice(source.price)}`);
  }

  return parts.join("\n");
}

/** Sin título ni descripción no hay nada que representar; se prefiere `null` a un vector de ruido. */
export function hasEmbeddableText(source: PostEmbeddingSource): boolean {
  return Boolean(source.title.trim() || source.content?.trim());
}

export function hasExpectedDimensions(embedding: readonly number[]): boolean {
  return (
    Array.isArray(embedding) &&
    embedding.length === EMBEDDING_DIMENSIONS &&
    embedding.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  );
}
