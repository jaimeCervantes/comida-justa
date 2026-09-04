import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveInventoryScope } from "~/domain/entities/post/inventoryScope";
import type { User } from "~/domain/entities/post/types";
import { normalizeListTerm } from "~/domain/search/listTerm";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { redirectToSignIn } from "~/infra/auth/redirectToSignIn";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createStoreInventoryRepository } from "~/infra/dataAccess/storeInventory/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import QueryPagination from "~/presentation/navigation/QueryPagination/QueryPagination";
import AccountSection from "../ui/AccountSection";
import InventoryScopes from "./ui/InventoryScopes";
import InventorySearchField from "./ui/InventorySearchField";
import InventoryTable from "./ui/InventoryTable";
import { type InventoryParams, inventoryHref } from "./ui/inventoryHref";

/**
 * Cuántos renglones por página.
 *
 * Veinte y no diez como los pedidos: aquí no se lee cada renglón, se busca uno y se escribe un
 * número, así que caben más antes de que la página se haga larga. Lo que importa no es el número
 * exacto sino que **haya uno**: `Hazlo Sano` tiene 418 productos y meterlos todos en el HTML de
 * cada visita es el defecto que esta constante existe para evitar.
 */
const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");

  return {
    title: t("inventoryHeading"),
    description: t("inventoryMetaDescription"),
    // Privada: depende de la sesión y no hay nada que indexar.
    robots: { index: false, follow: false },
  };
}

function readParams(
  raw: Record<string, string | string[] | undefined>,
): InventoryParams {
  const page = Number(raw.pagina);

  return {
    scope: resolveInventoryScope(raw.filtro),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    term: normalizeListTerm(raw.q),
  };
}

/**
 * El panel donde la tienda lleva las existencias de su catálogo.
 *
 * **Existe por un número: 418.** Poner inventario producto por producto desde su ficha es abrir 418
 * páginas, o sea no hacerlo nunca. Aquí se ve una página de renglones con el campo dentro, y los
 * filtros contestan las dos preguntas que se hacen de verdad: qué hay que reponer y qué falta por
 * poner a contar.
 *
 * **El inventario es de la tienda, no de quien escribió cada ficha.** La consulta filtra por
 * `seller_id` y no por `user_id`, que es la misma decisión que toma `canManagePost` al autorizar la
 * escritura: si el dueño puede guardar el número, tiene que poder verlo.
 */
export default async function InventarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("account");

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) redirectToSignIn(locale, "/cuenta/inventario");

  const seller = await findSellerOfUser(userId);

  /* Sin tienda no hay catálogo que contar: se dice, en vez de enseñar una tabla vacía que parece
     un fallo. Es la misma respuesta que ya da la agenda, y por el mismo motivo. */
  if (!seller) {
    return (
      <AccountSection active="inventory">
        <Heading level={1} className="mb-2">
          {t("inventoryHeading")}
        </Heading>
        <p data-testid="inventory-needs-store">{t("inventoryNeedsStore")}</p>
      </AccountSection>
    );
  }

  const current = readParams(await searchParams);

  const { items, total } = await createStoreInventoryRepository().listBySeller(
    seller.id,
    {
      scope: current.scope,
      term: current.term,
      page: current.page,
      pageSize: PAGE_SIZE,
      locale,
      fallbackLocale: routing.defaultLocale,
    },
  );

  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AccountSection active="inventory">
      <Heading level={1} className="mb-2">
        {t("inventoryHeading")}
      </Heading>
      <p className="mb-6 text-text-support">{t("inventoryIntro")}</p>

      <InventorySearchField current={current} />
      <InventoryScopes current={current} />

      {items.length === 0 ? (
        /* No es lo mismo «no hay nada que coincida» que «aquí no hay nada»: lo primero se arregla
           borrando el filtro y lo segundo poniéndose a publicar. Decir el segundo cuando pasa el
           primero hace creer que se perdió el catálogo. */
        <p data-testid="inventory-empty">
          {current.term || current.scope !== "all"
            ? t("inventoryNothingFound")
            : t("inventoryEmpty")}
        </p>
      ) : (
        <InventoryTable items={items} />
      )}

      <QueryPagination
        page={current.page}
        total={total}
        pageSize={PAGE_SIZE}
        hrefForPage={(page) => inventoryHref(current, { page })}
        labels={{
          previous: t("inventoryPrevious"),
          next: t("inventoryNext"),
          position: t("inventoryPageOf", {
            page: current.page,
            total: lastPage,
          }),
        }}
        testId="inventory-pagination"
      />
    </AccountSection>
  );
}
