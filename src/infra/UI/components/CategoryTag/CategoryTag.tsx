import { Badge } from "~/presentation/design_system/badges/Badge";

type CategoryTagProps = {
  /**
   * La etiqueta ya resuelta al idioma del visitante. La taxonomía vive en la base, y este
   * componente se renderiza también dentro de un árbol cliente, así que la traducción la hace el
   * servidor (`mapPostsToCards`, `PostDetail`) y aquí solo llega el texto.
   */
  label?: string | null;
  className?: string;
};

/** Sin etiqueta no se pinta nada: una publicación sin categoría no lleva chip vacío. */
export default function CategoryTag({
  label,
  className = "",
}: CategoryTagProps) {
  if (!label) return null;

  return (
    <Badge tone="accent" className={className} data-testid="category-tag">
      {label}
    </Badge>
  );
}
