/**
 * Qué es una publicación: un `anuncio` (aviso/contenido) o un `producto` (algo en venta).
 * Eje ortogonal a `origin` (de dónde/quién viene). Un "producto de Hazlo Sano" es
 * `kind = "producto"` con un `origin` de tipo `hazlo_sano_*`.
 */
export const POST_KINDS = ["anuncio", "producto"] as const;

export type PostKind = (typeof POST_KINDS)[number];

export const DEFAULT_POST_KIND: PostKind = "anuncio";

export function isValidKind(value: unknown): value is PostKind {
  return (
    typeof value === "string" &&
    (POST_KINDS as readonly string[]).includes(value)
  );
}
