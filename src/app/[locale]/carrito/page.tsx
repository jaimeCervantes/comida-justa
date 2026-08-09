import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale, routing } from "~/i18n/routing";
import { readCartSelection } from "~/infra/cart/readCart";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { createCartProductRepository } from "~/infra/dataAccess/cart/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import ViewCartUseCase from "~/use_cases/viewCart/viewCartUseCase";
import CartGroup from "./ui/CartGroup";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");

  return {
    title: t("title"),
    // Es el carrito de quien mira: no hay nada que indexar y su contenido sale de una cookie.
    robots: { index: false, follow: false },
  };
}

/**
 * El carrito, partido en un pedido por tienda.
 *
 * Es un Server Component porque la cookie viaja en la petición: no hay estado de cliente que
 * hidratar ni parpadeo entre "vacío" y lo que de verdad lleva. Los precios se releen aquí en cada
 * visita — la cookie solo recuerda qué y cuántos.
 */
export default async function CarritoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("cart");

  const selection = await readCartSelection();
  const groups = await new ViewCartUseCase(
    createCartProductRepository(),
  ).execute({
    selection,
    locale,
    fallbackLocale: routing.defaultLocale,
  });

  return (
    <main>
      <Heading level={1} className="mb-6">
        {t("title")}
      </Heading>

      {groups.length === 0 ? (
        <p data-testid="cart-empty">
          {t("empty")}{" "}
          <Link
            href="/productos"
            className="font-medium text-pw-green underline"
          >
            {t("emptyCta")}
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <CartGroup
              key={group.seller.id}
              group={group}
              baseUrl={publicBaseUrlFor(locale)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* El enlace que viaja al vendedor tiene que abrir en el idioma en que se pidió. `localePrefix` es
   `as-needed`: el español va sin prefijo y solo el inglés lo lleva. */
function publicBaseUrlFor(locale: string): string {
  return locale === routing.defaultLocale
    ? PUBLIC_BASE_URL
    : `${PUBLIC_BASE_URL}/${locale}`;
}
