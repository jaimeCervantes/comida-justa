import type { AppHref } from "~/i18n/navigation";
import { Link } from "~/i18n/navigation";

export interface Crumb {
  label: string;
  /** El último paso —la página que se está viendo— no lleva enlace. */
  href?: AppHref;
}

/**
 * El camino que llevó hasta esta página.
 *
 * Existe por dos motivos a la vez: quien llega desde un buscador aterriza en una publicación sin
 * haber pasado por el catálogo y no tiene forma de subir, y el `BreadcrumbList` de datos
 * estructurados **solo se puede declarar si la página lo enseña**.
 *
 * No lee el catálogo de traducciones: recibe las etiquetas ya resueltas, incluida la de
 * accesibilidad, para poder pintarse igual en cualquier idioma y desde cualquier ruta.
 */
export default function Breadcrumbs({
  items,
  ariaLabel,
  className,
}: {
  items: readonly Crumb[];
  ariaLabel: string;
  className?: string;
}) {
  // Un solo paso es la propia página: no hay camino que enseñar.
  if (items.length < 2) return null;

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-pw-green">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
