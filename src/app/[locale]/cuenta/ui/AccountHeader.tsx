import { useLocale, useTranslations } from "next-intl";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { CARD_PADDING } from "~/presentation/design_system/surfaces/cardSpacing";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import StoreLogo from "~/presentation/identity/StoreLogo";
import { profileHref, profilePath } from "../profilePath";
import { storeHref, storePath } from "../storePath";
import PublicAddressRow from "./PublicAddressRow";

const LOGO_SIZE = 56;

/**
 * Quién eres dentro de la plataforma, arriba del todo: tu tienda y las direcciones que repartes.
 *
 * **Es la dueña de las dos direcciones públicas, y por eso se llevó dos tarjetas por delante.** La
 * de la tienda vivía en `StoreCard` y la personal en la rama «ya reservada» de `UsernameSection`,
 * cada una a media pantalla de la otra y ninguna a la vista al entrar. Subirlas aquí sin quitarlas
 * de allí habría pintado cada dirección **dos veces en la misma pantalla**, que es peor que el
 * problema que se venía a arreglar; así que las dos tarjetas salieron de la página. El formulario
 * de `UsernameSection` se queda **mientras no haya dirección reservada**: ahí no es un duplicado,
 * es la acción que falta.
 *
 * **El nombre de la tienda es el `h1`.** El título de la página era «Mi cuenta», que es lo que dice
 * el menú de la izquierda dos centímetros más allá: repetirlo gastaba el único encabezado de nivel 1
 * en no decir nada. Sin tienda abierta sí se usa «Mi cuenta», porque entonces no hay nada más que
 * nombrar.
 *
 * **El logo es el mismo `StoreLogo` del resto del sitio**, no uno nuevo más grande: la tienda tiene
 * que verse igual aquí, en el detalle de una publicación y en el panel del mapa. Cae a su inicial
 * cuando no hay logo, así que la fila mide lo mismo con imagen y sin ella.
 */
export default function AccountHeader({
  storeName,
  logoUrl,
  handle,
  username,
  className,
}: {
  /** El nombre de la tienda, o `null` para quien todavía no ha abierto ninguna. */
  storeName: string | null;
  logoUrl: string | null;
  /** `sellers.slug`: su dirección en `/tienda/<handle>`. */
  handle: string | null;
  username: string | null;
  className?: string;
}) {
  const t = useTranslations("account");
  const locale = resolveLocale(useLocale());
  const title = storeName ?? t("identityHeadingNoStore");

  /**
   * Sin tienda ni dirección reservada no hay identidad que enmarcar, y una tarjeta con un título
   * dentro y nada más es un marco alrededor del vacío: ocupa el sitio de una tarjeta y no dice lo
   * que una tarjeta promete. Ahí la cabecera se queda en el `h1` pelado, y quien manda en la
   * pantalla pasa a ser la lista de pendientes — que es justo lo que esa persona necesita.
   */
  const hasIdentity = Boolean(storeName || handle || username);

  if (!hasIdentity) {
    return (
      <header data-testid="account-identity" className={className}>
        <Heading level={1} size="md">
          {title}
        </Heading>
      </header>
    );
  }

  return (
    <Surface
      as="header"
      background="raised"
      border="subtle"
      elevation="sm"
      radius="card"
      data-testid="account-identity"
      className={cn(CARD_PADDING, "flex flex-col gap-5", className)}
    >
      <div className="flex items-center gap-4">
        {storeName ? (
          <StoreLogo logoUrl={logoUrl} name={storeName} size={LOGO_SIZE} />
        ) : null}

        <Heading level={1} size="md" className="min-w-0 break-words">
          {title}
        </Heading>
      </div>

      {/* Los vendedores que creó el chatbot no tienen dirección; darles una es otro slice. Se dice
          en vez de callar, que es lo que hacía la tarjeta que esta cabecera reemplazó. */}
      {storeName && !handle ? (
        <p className="text-sm text-text-support">
          {t("storeCardNoPublicPage")}
        </p>
      ) : null}

      {handle || username ? (
        <div className="flex flex-col gap-4">
          {handle ? (
            <LabelledAddress label={t("identityStoreAddress")}>
              <PublicAddressRow
                href={storeHref(handle)}
                path={storePath(handle, locale)}
                shareUrl={`${PUBLIC_BASE_URL}${storePath(handle, locale)}`}
                shareTitle={title}
                shareText={t("shareStoreText", { name: title })}
                shareTestId="share-store"
              />
            </LabelledAddress>
          ) : null}

          {username ? (
            <LabelledAddress label={t("identityProfileAddress")}>
              <PublicAddressRow
                href={profileHref(username)}
                path={profilePath(username, locale)}
                shareUrl={`${PUBLIC_BASE_URL}${profilePath(username, locale)}`}
                shareTitle={title}
                shareText={t("shareProfileText", { name: title })}
                shareTestId="share-profile"
              />
            </LabelledAddress>
          ) : null}
        </div>
      ) : null}
    </Surface>
  );
}

/**
 * El rótulo va **encima** de la dirección y no al lado.
 *
 * A su lado, el renglón lleva tres cosas —rótulo, camino y botón de repartir— y en un teléfono de
 * 390 px el botón se cae fuera de la tarjeta; es el mismo motivo por el que `PublicAddressRow`
 * enseña el camino corto y no la dirección absoluta.
 */
function LabelledAddress({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption uppercase tracking-[0.14em] font-semibold text-text-support">
        {label}
      </span>
      {children}
    </div>
  );
}
