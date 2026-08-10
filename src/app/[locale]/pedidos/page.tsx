import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import BuyerOrders from "./ui/BuyerOrders";
import SellerOrders from "./ui/SellerOrders";

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
 * **Un solo destino y no dos.** La misma persona compra y vende —de hecho hoy la única tienda es de
 * alguien que también compra—, así que partirlo en dos direcciones obliga a elegir "¿en qué papel
 * entro?" antes de saber si hay algo que atender. Aquí lo que hay se ve de un vistazo.
 *
 * Lo del vendedor va primero **porque es lo que tiene prisa**: un pedido pendiente es alguien
 * esperando respuesta, mientras que mirar lo que uno pidió puede esperar.
 *
 * Antes esto vivía dentro de `/cuenta`, mezclado con la ficha de la tienda y las sucursales. Se
 * separó porque son cosas distintas: `/cuenta` es quién eres y cómo te presentas —se toca una vez y
 * se olvida—, y esto es actividad que cambia cada día.
 */
export default async function PedidosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));
  const t = await getTranslations("orders");

  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const repository = createOrderRepository();
  const seller = await findSellerOfUser(userId);

  /* Las dos listas van juntas: son independientes y en serie costaban dos viajes. La del vendedor
     solo se pide si hay tienda — quien no vende no tiene nada que leer ahí. */
  const [received, placed] = await Promise.all([
    seller ? repository.listBySeller(seller.id) : Promise.resolve([]),
    repository.listByBuyer(userId),
  ]);

  return (
    <main>
      <Heading level={1} className="mb-6">
        {t("heading")}
      </Heading>

      <div className="flex flex-col gap-10">
        {seller ? (
          <section data-testid="orders-received">
            <h2 className="mb-4 text-body-lg font-bold">
              {t("sellerHeading")}
            </h2>
            <SellerOrders orders={received} />
          </section>
        ) : null}

        <section data-testid="orders-placed">
          <h2 className="mb-4 text-body-lg font-bold">{t("buyerHeading")}</h2>
          <BuyerOrders orders={placed} />
        </section>
      </div>
    </main>
  );
}
