import type { ReactNode } from "react";
import { type AppHref, Link } from "~/i18n/navigation";

/**
 * Un enlace a quien está detrás de algo: una tienda o una persona, con su cara y su nombre.
 *
 * Existe para que el nombre y la imagen no se separen nunca. Hoy se enlaza a una tienda o a un
 * perfil desde cuatro sitios —la ficha por arriba y por abajo, la tienda hacia su dueño, el perfil
 * hacia su tienda y el directorio—, y escribir el par en cada uno era la primera de cuatro copias.
 *
 * Recibe el destino ya armado: `storeHref`/`profileHref` viven en `app/`, y un componente de
 * `presentation/` no puede depender de una ruta (mismo motivo que `StoreSummaryCard`).
 */
export default function IdentityLink({
  href,
  label,
  hideLabel = false,
  media,
  testId,
  className = "",
}: {
  href: AppHref;
  /** Lo que se anuncia. La imagen no aporta nada que esto no diga. */
  label: string;
  /**
   * Deja el nombre solo para quien escucha.
   *
   * Arriba en la ficha la fila es una firma —logo, cara, categoría, distancia— y el nombre repetido
   * la alarga sin decir nada nuevo. Pero el enlace no puede quedarse mudo: su única cría visible es
   * una imagen decorativa, así que el texto sigue en el árbol, escondido, y no en un `title`.
   */
  hideLabel?: boolean;
  /** La cara: un `StoreLogo` o un `Avatar`. Ya viene marcada como decorativa. */
  media: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={`inline-flex items-center gap-2 hover:underline ${className}`}
    >
      {media}
      {hideLabel ? <span className="sr-only">{label}</span> : label}
    </Link>
  );
}
