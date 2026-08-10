import { getTranslations } from "next-intl/server";
import type { OrderScope } from "~/domain/order/order";
import { Link } from "~/i18n/navigation";

export type OrdersView = "received" | "placed";

export interface OrdersParams {
  view: OrdersView;
  scope: OrderScope;
  term: string;
  page: number;
}

/** Los tres ámbitos, en el orden en que se ofrecen. */
const SCOPES: readonly OrderScope[] = ["open", "closed", "all"];

/**
 * Arma la dirección de la lista cambiando **solo** lo que se pide.
 *
 * Todo lo demás se conserva: cambiar de estado no puede perder la búsqueda, y buscar no puede
 * dejarte en la página 4 de un resultado que tiene una.
 */
export function ordersHref(
  current: OrdersParams,
  change: Partial<OrdersParams>,
): { pathname: "/pedidos"; query: Record<string, string> } {
  const next = { ...current, ...change };
  const query: Record<string, string> = { vista: next.view };

  if (next.scope !== "open") query.estado = next.scope;
  if (next.term) query.q = next.term;
  // La página vuelve a 1 en cuanto cambia el filtro: `change.page` manda si viene.
  if (next.page > 1 && change.page !== undefined)
    query.pagina = String(next.page);

  return { pathname: "/pedidos", query };
}

/**
 * Las pestañas, el filtro de estado y la búsqueda.
 *
 * **Pestañas y no las dos listas apiladas**, que es como estaba. Al ganar cada lista su búsqueda, su
 * filtro y su paginación, apilarlas significaba dos buscadores y dos paginaciones en la misma
 * pantalla. Con pestañas hay un solo juego de controles, y el número que llevan al lado dice si hay
 * algo esperando **en la otra** — que es lo único que se perdía al no verlas juntas.
 *
 * La búsqueda es un `<form method="get">`: sin JavaScript sigue funcionando, y el navegador arma la
 * URL solo. Los demás filtros viajan como campos ocultos para no perderse al buscar.
 */
export default async function OrdersControls({
  current,
  counts,
  isSeller,
}: {
  current: OrdersParams;
  counts: { received: number; placed: number };
  isSeller: boolean;
}) {
  const t = await getTranslations("orders");

  return (
    <div className="mb-6 flex flex-col gap-4">
      {isSeller ? (
        <nav className="flex gap-2" data-testid="orders-tabs">
          <Tab
            view="received"
            current={current}
            label={t("sellerHeading")}
            count={counts.received}
          />
          <Tab
            view="placed"
            current={current}
            label={t("buyerHeading")}
            count={counts.placed}
          />
        </nav>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" data-testid="orders-scopes">
          {SCOPES.map((scope) => (
            <Link
              key={scope}
              href={ordersHref(current, { scope, page: 1 })}
              data-testid={`orders-scope-${scope}`}
              aria-current={current.scope === scope ? "page" : undefined}
              className={
                current.scope === scope
                  ? "focus-ring rounded-full bg-pw-green px-3 py-1 text-label text-white"
                  : "focus-ring rounded-full border border-separator px-3 py-1 text-label text-text-support"
              }
            >
              {t(`scope.${scope}`)}
            </Link>
          ))}
        </div>

        <form method="get" className="flex grow items-center gap-2">
          <input type="hidden" name="vista" value={current.view} />
          {current.scope === "open" ? null : (
            <input type="hidden" name="estado" value={current.scope} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={current.term}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            data-testid="orders-search"
            className="min-w-40 grow rounded-lg border border-separator bg-transparent px-3 py-1"
          />
        </form>
      </div>
    </div>
  );
}

function Tab({
  view,
  current,
  label,
  count,
}: {
  view: OrdersView;
  current: OrdersParams;
  label: string;
  count: number;
}) {
  const active = current.view === view;

  return (
    <Link
      href={ordersHref(current, { view, page: 1 })}
      data-testid={`orders-tab-${view}`}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "focus-ring rounded-lg border-b-2 border-pw-green px-3 py-2 font-medium text-text-base"
          : "focus-ring rounded-lg px-3 py-2 text-text-support hover:text-text-base"
      }
    >
      {label}
      {/* Solo cuando hay algo: un cero al lado de la pestaña es ruido que se lee como aviso. */}
      {count > 0 ? (
        <span
          data-testid={`orders-count-${view}`}
          className="ml-2 rounded-full bg-pw-orange px-2 text-xs font-bold text-white"
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
