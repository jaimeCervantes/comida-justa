import { useTranslations } from "next-intl";
import { isSellable } from "~/domain/entities/post/availability";
import { Link } from "~/i18n/navigation";
import { storeHref } from "~/i18n/routes";
import { PUBLIC_BASE_URL, SITE_CURRENCY } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import { CARD_ROW } from "~/presentation/design_system/surfaces/cardSpacing";
import IdentityLink from "~/presentation/identity/IdentityLink";
import type { StoreIdentity } from "~/presentation/identity/StoreIdentity";
import StoreLogo from "~/presentation/identity/StoreLogo";
import StoreDistance from "~/presentation/location/StoreDistance";
import MediaContent from "~/presentation/media/MediaContent/MediaContent";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import Card from "~/presentation/post/Card";
import CardOwnerControls from "~/presentation/post/CardOwnerControls";
import CategoryTag from "~/presentation/post/CategoryTag/CategoryTag";
import ProvenanceBadge, {
  showsProvenanceBadge,
} from "~/presentation/post/ProvenanceBadge";
import SoldOutBadge from "~/presentation/post/SoldOutBadge/SoldOutBadge";
import ShareMenu from "~/presentation/sharing/ShareMenu/ShareMenu";

/**
 * El último tramo del destino, para cuando la tarjeta llega sin `slug`.
 *
 * `to` viene **absoluto** (`http://host/suero-natural`), así que recortar el primer `/` devolvía la
 * URL entera y el enlace de edición acababa en `/editar/http://host/suero-natural`. El camino bueno
 * es que el mapper publique el slug; esto es solo la red por si alguien arma una tarjeta a mano.
 */
function slugFromUrl(to: unknown): string {
  if (typeof to !== "string") return "";

  return to.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() ?? "";
}

/**
 * La dirección **absoluta** de la publicación, que es la que se reparte.
 *
 * `to` ya llega absoluta desde `mapPostsToCards` (`createAbsoluteUrl`). El respaldo es para las
 * tarjetas que alguien arme a mano: compartir un camino relativo produce un enlace que no resuelve
 * en ninguna otra aplicación, que es exactamente donde va a acabar pegado.
 */
function absoluteUrl(to: string): string {
  if (/^https?:\/\//i.test(to)) return to;

  return `${PUBLIC_BASE_URL}${to.startsWith("/") ? to : `/${to}`}`;
}

/**
 * Una publicación en forma de tarjeta.
 *
 * `viewerId` decide si además se le ofrecen los controles de dueño. Es un **prop** y no una lectura
 * de sesión aquí adentro porque esta tarjeta también se pinta dentro de componentes de cliente —el
 * scroll infinito del home—, donde `auth()` no existe. Quien sabe quién mira es la página.
 */
export default function CardForList(
  props: Post & { viewerId?: string | null; seller?: StoreIdentity | null },
) {
  const {
    id,
    title,
    media,
    createdAt,
    price,
    user,
    to,
    slug,
    kind,
    origin,
    distanceMeters,
    isAvailable,
    categoryLabel,
    seller,
    viewerId,
  } = props;
  const anchorProps = { href: to, title: title };
  const isOwner = Boolean(viewerId) && user?.id === viewerId;
  /* Se lee del catálogo y no viaja como dato, a diferencia de `categoryLabel`: ese necesita la
     base y por eso se resuelve en el servidor; esto es solo una cadena del catálogo, que el
     proveedor de next-intl tiene disponible también en el árbol cliente. */
  const tShare = useTranslations("share");

  return (
    <Card
      key={id}
      title={title}
      createdAt={createdAt}
      user={user}
      className="flex flex-col justify-between"
      AnchorElement={Link}
      anchorProps={anchorProps}
      /* Solo el icono: doce tarjetas con un botón que dice «Compartir» compiten con los doce
         títulos, que es lo que se viene a leer. El nombre accesible sigue siendo el completo. */
      actions={
        <ShareMenu
          variant="icon"
          testId="card-share"
          url={absoluteUrl(to)}
          title={title}
          text={tShare("postText", { title })}
        />
      }
      media={
        <Link {...anchorProps}>
          <MediaContent media={media[0]} className="h-64" />
        </Link>
      }
    >
      {/* Todo lo que se mira para decidir, en un renglón que se parte en varios cuando no cabe:
          quién lo vende, qué es, si queda, a qué distancia y cuánto cuesta. Es la misma línea que
          la ficha (`PostDetail`) y el mismo `CARD_ROW`, para que la tarjeta y el detalle se lean
          igual — antes el precio caía aparte, en su propia línea con margen propio.

          Un anuncio no tiene ninguno de esos datos: los 10 de la base van sin precio, sin categoría
          y sin origen. `CARD_ROW` lleva `empty:hidden` para que en ese caso la fila desaparezca en
          vez de dejar un hueco bajo el título.

          Quien publica no está aquí —ya firma abajo, junto a la fecha—; la tienda sí, porque no
          aparece en ningún otro sitio. */}
      <span className={CARD_ROW} data-testid="card-facts">
        {seller ? (
          <IdentityLink
            href={storeHref(seller.handle)}
            label={seller.name}
            hideLabel
            testId="card-store"
            media={
              <StoreLogo
                logoUrl={seller.logoUrl}
                name={seller.name}
                size={24}
                testId="card-store-media"
              />
            }
          />
        ) : null}
        {/* Se calla cuando el logo de al lado ya lo dijo: ver `provenanceVisibility.ts`. */}
        {showsProvenanceBadge(origin, Boolean(seller)) ? (
          <ProvenanceBadge origin={origin} />
        ) : null}
        <CategoryTag label={categoryLabel} />
        <SoldOutBadge kind={kind} isAvailable={isAvailable} />
        <StoreDistance meters={distanceMeters ?? null} />

        {/* Sin `block mt-1`: dentro de la fila, un salto de línea y un margen propio peleaban con
            el `gap` de la fila. `CurrencyAmount` se calla solo cuando no hay precio, así que un
            anuncio no deja hueco. La moneda sale de la constante del sitio y no de un "MXN"
            escrito aquí, que es lo que hacía esta tarjeta mientras la ficha ya usaba la constante. */}
        <CurrencyAmount
          value={price}
          currency={SITE_CURRENCY}
          className="text-xl text-pw-green"
        />
      </span>

      {isOwner ? (
        <CardOwnerControls
          postId={String(id ?? "")}
          slug={slug ? String(slug) : slugFromUrl(to)}
          isAvailable={isAvailable !== false}
          isSellable={isSellable({ kind })}
        />
      ) : null}
    </Card>
  );
}
