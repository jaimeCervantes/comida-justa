/**
 * Qué tipo de producto es. Se persiste como `text` (no enum de BD) y se valida contra estas
 * allowlists, de modo que agregar un valor nuevo = editar esta constante, sin migración.
 *
 * **Se guarda la clave, nunca la etiqueta.** `alimentacion`, no `"Alimentación"`: la etiqueta
 * depende del idioma del visitante y vive en `~/infra/UI/labels/postCategoryLabels`. Guardar
 * la etiqueta metería español en la UI en inglés y en el texto que alimenta el embedding.
 */
export const POST_CATEGORIES = ["alimentacion"] as const;

export const POST_SUB_CATEGORIES = [
  "jugos",
  "comidas",
  "bebidas",
  "panaderia",
  "abarrotes",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];
export type PostSubCategory = (typeof POST_SUB_CATEGORIES)[number];

export function isValidCategory(value: unknown): value is PostCategory {
  return (
    typeof value === "string" &&
    (POST_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isValidSubCategory(value: unknown): value is PostSubCategory {
  return (
    typeof value === "string" &&
    (POST_SUB_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Normaliza la `category` recibida de un request. Es la defensa en servidor: un valor fuera de
 * la allowlist se ignora (se guarda `null`) en vez de romper la publicación, igual que `origin`.
 * La comparación es exacta: `"Alimentación"` (etiqueta) y `"ALIMENTACION"` (mayúsculas) no pasan.
 */
export function resolveCategory(
  raw: string | null | undefined,
): PostCategory | null {
  if (!raw) return null;
  return isValidCategory(raw) ? raw : null;
}

export function resolveSubCategory(
  raw: string | null | undefined,
): PostSubCategory | null {
  if (!raw) return null;
  return isValidSubCategory(raw) ? raw : null;
}
