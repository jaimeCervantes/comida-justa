import type {
  PostCategory,
  PostSubCategory,
} from "~/domain/entities/post/category";
import {
  categoryLabel,
  subCategoryLabel,
} from "~/infra/UI/labels/postCategoryLabels";

type CategoryTagProps = {
  category?: string | null;
  subCategory?: string | null;
  /** Idioma del visitante; sin él se usa el idioma por defecto del sitio. */
  locale?: string;
  className?: string;
};

/**
 * Etiqueta visible de la categoría de un producto. La BD guarda la clave (`jugos`), así que el
 * texto se resuelve por idioma aquí; si la publicación no tiene categoría no renderiza nada.
 * Cuando hay sub-categoría se muestra esa, por ser la más específica.
 */
export default function CategoryTag({
  category,
  subCategory,
  locale,
  className = "",
}: CategoryTagProps) {
  const label =
    subCategoryLabel(subCategory as PostSubCategory | null, locale) ??
    categoryLabel(category as PostCategory | null, locale);

  if (!label) return null;

  return (
    <span
      data-testid="category-tag"
      className={`inline-flex items-center gap-1 rounded-full bg-pw-orange/10 px-3 py-1 text-sm font-medium text-pw-orange ${className}`}
    >
      {label}
    </span>
  );
}
