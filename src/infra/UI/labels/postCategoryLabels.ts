import {
  POST_CATEGORIES,
  POST_SUB_CATEGORIES,
  type PostCategory,
  type PostSubCategory,
} from "~/domain/entities/post/category";

/**
 * Etiqueta visible de cada clave de categoría, por idioma. La allowlist vive en el dominio;
 * aquí solo se nombra. La BD guarda la clave (`jugos`), nunca la etiqueta, así que la misma
 * publicación se lee "Jugos" en español y "Juices" en inglés sin tocar el dato.
 */
export type LabelLocale = "es" | "en";

const DEFAULT_LABEL_LOCALE: LabelLocale = "es";

const CATEGORY_LABELS: Record<LabelLocale, Record<PostCategory, string>> = {
  es: { alimentacion: "Alimentación" },
  en: { alimentacion: "Food" },
};

const SUB_CATEGORY_LABELS: Record<
  LabelLocale,
  Record<PostSubCategory, string>
> = {
  es: {
    jugos: "Jugos",
    comidas: "Comidas",
    bebidas: "Bebidas",
    panaderia: "Panadería",
    abarrotes: "Abarrotes",
  },
  en: {
    jugos: "Juices",
    comidas: "Meals",
    bebidas: "Drinks",
    panaderia: "Bakery",
    abarrotes: "Groceries",
  },
};

function normalizeLocale(locale: string | undefined): LabelLocale {
  return locale === "en" || locale === "es" ? locale : DEFAULT_LABEL_LOCALE;
}

export function categoryLabel(
  category: PostCategory | null | undefined,
  locale?: string,
): string | null {
  if (!category) return null;
  return CATEGORY_LABELS[normalizeLocale(locale)][category] ?? null;
}

export function subCategoryLabel(
  subCategory: PostSubCategory | null | undefined,
  locale?: string,
): string | null {
  if (!subCategory) return null;
  return SUB_CATEGORY_LABELS[normalizeLocale(locale)][subCategory] ?? null;
}

/** Opciones del selector, en el orden canónico de la allowlist. */
export function categoryOptions(
  locale?: string,
): ReadonlyArray<{ value: PostCategory; label: string }> {
  return POST_CATEGORIES.map((value) => ({
    value,
    label: CATEGORY_LABELS[normalizeLocale(locale)][value],
  }));
}

export function subCategoryOptions(
  locale?: string,
): ReadonlyArray<{ value: PostSubCategory; label: string }> {
  return POST_SUB_CATEGORIES.map((value) => ({
    value,
    label: SUB_CATEGORY_LABELS[normalizeLocale(locale)][value],
  }));
}
