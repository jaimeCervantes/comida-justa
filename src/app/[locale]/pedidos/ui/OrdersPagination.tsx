import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { type OrdersParams, ordersHref } from "./OrdersControls";

const LINK =
  "focus-ring rounded-full border border-separator bg-surface-elevation-1 px-4 py-2 text-text-base transition-colors hover:bg-surface-elevation-2";

/**
 * Anterior y siguiente para la lista de pedidos.
 *
 * **No reutiliza `presentation/navigation/Pagination`** a propósito: aquel pagina por segmento de
 * ruta (`/productos/page/2`) contra las rutas declaradas en `routing.ts`, y aquí la página convive
 * con la pestaña, el estado y la búsqueda, que viajan como parámetros de consulta. Meterle soporte
 * de query lo habría convertido en dos componentes dentro de uno.
 *
 * Sin números de página: con una lista que se recorre buscando algo concreto, "anterior/siguiente"
 * es todo lo que se usa, y evita calcular cuántas páginas hay para pintarlas.
 */
export default async function OrdersPagination({
  current,
  total,
  pageSize,
}: {
  current: OrdersParams;
  total: number;
  pageSize: number;
}) {
  const t = await getTranslations("orders");
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  if (lastPage <= 1) return null;

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-3"
      data-testid="orders-pagination"
    >
      {current.page > 1 ? (
        <Link
          href={ordersHref(current, { page: current.page - 1 })}
          className={LINK}
          data-testid="orders-prev"
        >
          {t("previous")}
        </Link>
      ) : (
        <span />
      )}

      <span className="text-label text-text-support">
        {t("pageOf", { page: current.page, total: lastPage })}
      </span>

      {current.page < lastPage ? (
        <Link
          href={ordersHref(current, { page: current.page + 1 })}
          className={LINK}
          data-testid="orders-next"
        >
          {t("next")}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
