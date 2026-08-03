import { isSellable } from "~/domain/entities/post/availability";
import { Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import Card from "~/infra/UI/components/Card";
import CategoryTag from "~/infra/UI/components/CategoryTag/CategoryTag";
import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import ProvenanceBadge from "~/infra/UI/components/ProvenanceBadge";
import SoldOutBadge from "~/infra/UI/components/SoldOutBadge/SoldOutBadge";
import StoreDistance from "~/presentation/location/StoreDistance";
import CardOwnerControls from "~/presentation/post/CardOwnerControls";

/** El mapper deja el destino como `/<slug>`; de ahí sale el slug para el enlace de edición. */
function extractSlug(to: unknown): string {
  return typeof to === "string" ? to.replace(/^\//, "") : "";
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
          slug={String(slug ?? extractSlug(to))}
          isAvailable={isAvailable !== false}
          isSellable={isSellable({ kind })}
        />
      ) : null}
    </Card>
  );
}
