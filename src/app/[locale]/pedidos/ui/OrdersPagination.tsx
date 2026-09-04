import { getTranslations } from "next-intl/server";
import QueryPagination from "~/presentation/navigation/QueryPagination/QueryPagination";
import { type OrdersParams, ordersHref } from "./ordersHref";

/**
 * Anterior y siguiente para la lista de pedidos.
 *
 * Lo que se pinta vive en `QueryPagination`, compartido con el panel de inventario; aquí queda lo
 * único que es de los pedidos: cómo se arma su dirección y en qué namespace están sus frases.
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

  return (
    <QueryPagination
      page={current.page}
      total={total}
      pageSize={pageSize}
      hrefForPage={(page) => ordersHref(current, { page })}
      labels={{
        previous: t("previous"),
        next: t("next"),
        position: t("pageOf", { page: current.page, total: lastPage }),
      }}
      testId="orders-pagination"
    />
  );
}
