import { isSellable } from "~/domain/entities/post/availability";
import { Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import StoreDistance from "~/presentation/location/StoreDistance";
import MediaContent from "~/presentation/media/MediaContent/MediaContent";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import Card from "~/presentation/post/Card";
import CardOwnerControls from "~/presentation/post/CardOwnerControls";
import CategoryTag from "~/presentation/post/CategoryTag/CategoryTag";
import ProvenanceBadge from "~/presentation/post/ProvenanceBadge";
import SoldOutBadge from "~/presentation/post/SoldOutBadge/SoldOutBadge";

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
 * Una publicación en forma de tarjeta.
 *
 * `viewerId` decide si además se le ofrecen los controles de dueño. Es un **prop** y no una lectura
 * de sesión aquí adentro porque esta tarjeta también se pinta dentro de componentes de cliente —el
 * scroll infinito del home—, donde `auth()` no existe. Quien sabe quién mira es la página.
 */
export default function CardForList(
  props: Post & { viewerId?: string | null },
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
    viewerId,
  } = props;
  const anchorProps = { href: to, title: title };
  const isOwner = Boolean(viewerId) && user?.id === viewerId;

  return (
    <Card
      key={id}
      title={title}
      createdAt={createdAt}
      user={user}
      className="flex flex-col justify-between"
      AnchorElement={Link}
      anchorProps={anchorProps}
      media={
        <Link {...anchorProps}>
          <MediaContent media={media[0]} className="h-64" />
        </Link>
      }
    >
      <span className="flex flex-wrap items-center gap-2 mt-1">
        <ProvenanceBadge origin={origin} />
        <CategoryTag label={categoryLabel} />
        <SoldOutBadge kind={kind} isAvailable={isAvailable} />
        <StoreDistance meters={distanceMeters ?? null} />
      </span>

      <CurrencyAmount
        value={price}
        currency="MXN"
        className="text-xl text-pw-green block mt-1"
      ></CurrencyAmount>

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
