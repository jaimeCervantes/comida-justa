import { type AppHref, Link } from "~/i18n/navigation";

const LINK =
  "focus-ring rounded-full border border-separator bg-surface-elevation-1 px-4 py-2 text-text-base transition-colors hover:bg-surface-elevation-2";

export interface QueryPaginationLabels {
  previous: string;
  next: string;
  /** Ya interpolado por quien llama: «Página 2 de 7». */
  position: string;
}

/**
 * Anterior y siguiente para una lista que vive **en parámetros de consulta**.
 *
 * **No es `presentation/navigation/Pagination`** y sigue sin serlo: aquél pagina por segmento de
 * ruta (`/productos/page/2`) contra las rutas declaradas en `routing.ts`, y estas listas conviven
 * con filtros y búsquedas que viajan como query. Meterle soporte de query a aquél lo habría
 * convertido en dos componentes dentro de uno.
 *
 * **Sí es lo que antes estaba escrito sólo para pedidos.** Al llegar el panel de inventario iba a
 * ser el mismo componente por segunda vez, con las mismas clases y la misma cuenta de páginas
 * cambiando únicamente de dónde salen los enlaces. Lo que varía entra por parámetro: la función que
 * arma la dirección, las frases y el prefijo de los `data-testid`.
 *
 * Sin números de página: en una lista que se recorre buscando algo concreto, «anterior/siguiente»
 * es todo lo que se usa.
 *
 * **No lee el catálogo.** Vive en `presentation/` y podría, pero las tres frases son de la lista que
 * la monta —una habla de pedidos, otra de productos— y su namespace es de quien llama.
 */
export default function QueryPagination({
  page,
  total,
  pageSize,
  hrefForPage,
  labels,
  testId,
}: {
  page: number;
  total: number;
  pageSize: number;
  hrefForPage: (page: number) => AppHref;
  labels: QueryPaginationLabels;
  /** Prefijo de los `data-testid`: `<testId>`, `<testId>-prev` y `<testId>-next`. */
  testId: string;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  if (lastPage <= 1) return null;

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-3"
      data-testid={testId}
    >
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          className={LINK}
          data-testid={`${testId}-prev`}
        >
          {labels.previous}
        </Link>
      ) : (
        <span />
      )}

      <span className="text-label text-text-support">{labels.position}</span>

      {page < lastPage ? (
        <Link
          href={hrefForPage(page + 1)}
          className={LINK}
          data-testid={`${testId}-next`}
        >
          {labels.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
