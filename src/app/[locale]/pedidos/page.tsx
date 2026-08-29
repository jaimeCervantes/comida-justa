import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { resolveScope } from "~/domain/order/order";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import AccountSection from "../cuenta/ui/AccountSection";
import BuyerOrders from "./ui/BuyerOrders";
import OrdersControls from "./ui/OrdersControls";
import OrdersPagination from "./ui/OrdersPagination";
import type { OrdersParams } from "./ui/ordersHref";
import SellerOrders from "./ui/SellerOrders";

/**
 * Cuántos pedidos por página.
 *
 * Diez y no cuatro como el catálogo: un pedido ocupa poco alto y recorrer la lista buscando uno se
 * hace de un vistazo, no leyendo. Lo que importa no es el número exacto sino que **haya uno**: la
 * primera versión leía la lista entera y la metía en el HTML en cada visita.
 */
const PAGE_SIZE = 10;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");

  return {
    title: t("heading"),
    description: t("metaDescription"),
    // Es una página privada: depende de la sesión y no hay nada que indexar.
    robots: { index: false, follow: false },
  };
}

/**
 * Los pedidos de quien mira, en sus dos papeles.
 *
 * **Una sola pantalla y una sola lista a la vez.** Antes se apilaban las dos, y funcionaba mientras
 * no tenían controles; al ganar búsqueda, filtro y paginación, apilarlas significaba dos buscadores
 * y dos paginaciones compitiendo por los mismos parámetros. Las pestañas llevan el número de lo que
 * está esperando en la otra, que era lo único que se perdía.
 *
 * El vendedor entra por lo que le han pedido y **por lo abierto**: un pedido pendiente es alguien
 * esperando respuesta, y trescientos entregados detrás lo esconden.
 */
export default async function PedidosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("orders");

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectToSignIn(locale, "/pedidos");
  }

  /* Solo el vendedor: es lo que decide si hay una vista de "lo que me han pedido". Lo que el menú
     necesita —el usuario, para saber si ofrece "Mis publicaciones"— lo lee `AccountSection` por su
     cuenta, y como los dos lectores van cacheados por render eso no cuesta una consulta más. */
  const seller = await findSellerOfUser(userId);
  const current = readParams(await searchParams, Boolean(seller));

  const repository = createOrderRepository();
  const query = {
    page: current.page,
    pageSize: PAGE_SIZE,
    scope: current.scope,
    term: current.term,
    locale,
    fallbackLocale: routing.defaultLocale,
  };

  /* Se devuelve etiquetada con la vista para que TypeScript sepa qué componente puede recibirla:
     las dos listas no llevan la misma forma —la del comprador trae la tienda— y sin la etiqueta
     habría que forzar el tipo justo donde importa acertar. */
  const loadList = async () =>
    current.view === "received" && seller
      ? {
          view: "received" as const,
          ...(await repository.listBySeller(seller.id, query)),
        }
      : {
          view: "placed" as const,
          ...(await repository.listByBuyer(userId, query)),
        };

  /* El conteo va aparte de la lista **a propósito**: las pestañas tienen que decir cuántos esperan
     en la otra vista, y contar sobre la página que se pintó daría el número de esa página. */
  const [counts, list] = await Promise.all([
    repository.countOpen({ sellerId: seller?.id, buyerId: userId }),
    loadList(),
  ]);

  return (
    <AccountSection active="orders">
      <Heading level={1} className="mb-6">
        {t("heading")}
      </Heading>

      <OrdersControls
        current={current}
        counts={counts}
        isSeller={Boolean(seller)}
      />

      {list.view === "received" ? (
        <section data-testid="orders-received">
          <SellerOrders orders={list.orders} emptyKey={emptyKeyFor(current)} />
        </section>
      ) : (
        <section data-testid="orders-placed">
          <BuyerOrders orders={list.orders} emptyKey={emptyKeyFor(current)} />
        </section>
      )}

      <OrdersPagination
        current={current}
        total={list.total}
        pageSize={PAGE_SIZE}
      />
    </AccountSection>
  );
}

/**
 * Lo que llega en la URL, reducido a algo con sentido.
 *
 * Todo puede venir escrito a mano, así que nada se cree sin comprobar: una vista desconocida cae a
 * la que corresponde al papel, un estado raro cae a "abiertos" y una página que no es un número cae
 * a la primera.
 */
function readParams(
  search: Record<string, string | string[] | undefined>,
  isSeller: boolean,
): OrdersParams {
  const first = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const page = Number(first(search.pagina));

  return {
    /* Quien vende entra por lo que le han pedido; quien no, no tiene esa vista y cae a la suya
       aunque la pida por la URL. */
    view: isSeller && first(search.vista) !== "placed" ? "received" : "placed",
    scope: resolveScope(first(search.estado)),
    term: (first(search.q) ?? "").trim().slice(0, 80),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Qué decir cuando no hay nada: no es lo mismo «no tienes» que «no hay con ese filtro». */
function emptyKeyFor(current: OrdersParams): "filtered" | "none" {
  return current.term || current.scope !== "open" ? "filtered" : "none";
}
