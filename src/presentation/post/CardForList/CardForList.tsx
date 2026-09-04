import { useTranslations } from "next-intl";
import { canBeOrdered, isSellable } from "~/domain/entities/post/availability";
import { SERVICE_KIND } from "~/domain/entities/post/kind";
import { hasKnownAspect } from "~/domain/entities/post/mediaAspect";
import { canManagePost } from "~/domain/entities/post/postPermissions";
import { Link } from "~/i18n/navigation";
import { storeHref } from "~/i18n/routes";
import { PUBLIC_BASE_URL, SITE_CURRENCY } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import AddToCartButton from "~/presentation/cart/AddToCartButton/AddToCartButton";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
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
import EventDate from "~/presentation/post/EventDate/EventDate";
import PillarBadge from "~/presentation/post/PillarBadge/PillarBadge";
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
 *
 * `viewerSellerId` es la **segunda vía**: quien lleva la tienda administra su catálogo aunque cada
 * ficha la escribiera otra mano. Hasta ahora la tarjeta sólo preguntaba por quién publicó, así que
 * en `/tienda/<handle>` su dueño no veía nada sobre lo ajeno — el mismo hueco que el slice 1 cerró
 * en la ficha y que aquí seguía abierto. Es opcional porque sólo la tienda tiene algo que ganar:
 * en un perfil todo lo listado es de la misma cuenta.
 */
export default function CardForList(
  props: Post & {
    viewerId?: string | null;
    viewerSellerId?: string | null;
    seller?: StoreIdentity | null;
    onAvailabilityChange?: (postId: string, isAvailable: boolean) => void;
  },
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
    startsAt,
    endsAt,
    distanceMeters,
    isAvailable,
    category,
    categoryLabel,
    seller,
    viewerId,
    viewerSellerId,
    stockQuantity,
    onAvailabilityChange,
  } = props;
  const anchorProps = { href: to, title: title };
  const detailHref = slug ? `/${String(slug)}` : to;
  /* La misma regla que autoriza la escritura (`canManagePost`), preguntada aquí para no enseñar un
     control que el servidor iba a negar —ni esconder uno que sí habría aceptado—. */
  const canManage =
    Boolean(viewerId) &&
    canManagePost(
      {
        ownerId: String(user?.id ?? ""),
        sellerId: typeof props.sellerId === "string" ? props.sellerId : null,
      },
      { userId: String(viewerId), sellerId: viewerSellerId ?? null },
    );
  /* Se lee del catálogo y no viaja como dato, a diferencia de `categoryLabel`: ese necesita la
     base y por eso se resuelve en el servidor; esto es solo una cadena del catálogo, que el
     proveedor de next-intl tiene disponible también en el árbol cliente. */
  const tShare = useTranslations("share");
  const t = useTranslations("post");

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
      /* El alto fijo solo cuando NO se sabe la forma del archivo. Con ella, imponer 256 px
         recortaría por el centro justo lo que se viene a mirar: de las 15 imágenes de la base, 10
         son verticales y se les tiraba el 36%. Y es lo que da altura distinta a cada tarjeta, que
         es de lo que vive la mampostería. */
      media={
        <Link {...anchorProps} className="relative block">
          <MediaContent
            media={media[0]}
            className={hasKnownAspect(media[0] ?? {}) ? "" : "h-64"}
          />

          {/* El pilar, encima de la foto: en el feed lo primero que se mira es la imagen, y ahí
              es donde se lee de un vistazo. Se calla en lo que no tiene pilar —los anuncios van
              sin categoría—, así que no deja un hueco. */}
          <PillarBadge
            category={typeof category === "string" ? category : null}
            className="absolute left-2 top-2"
          />

          {/* Cuántos hay, sin tener que abrir la ficha. La portada sigue siendo `media[0]` —el de
              `sort_order` 0, el mismo que leen el carrito y el bot—; lo que se añade es el aviso de
              que detrás hay más, que es lo que convierte una tarjeta en algo que se toca. */}
          {media.length > 1 ? (
            <span
              data-testid="post-media-count"
              className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
            >
              {t("mediaCount", { count: media.length })}
            </span>
          ) : null}
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
        {/* Solo se pinta en un evento: es lo que responde "¿todavía puedo ir?". */}
        <EventDate kind={kind} startsAt={startsAt} endsAt={endsAt} />
        <StoreDistance meters={distanceMeters ?? null} />

        {/* Sin `block mt-1`: dentro de la fila, un salto de línea y un margen propio peleaban con
            el `gap` de la fila. `CurrencyAmount` se calla solo cuando no hay precio, así que un
            anuncio no deja hueco. La moneda sale de la constante del sitio y no de un "MXN"
            escrito aquí, que es lo que hacía esta tarjeta mientras la ficha ya usaba la constante. */}
        {/* Sin `className`: llevaba `text-xl text-pw-green`, que pisaba lo que el primitivo ya
            decide —serif, tamaño de sección y tinta—. El verde además señalaba como si el precio
            llevara a algún sitio, y no lleva. Ver el docstring de `CurrencyAmount`. */}
        <CurrencyAmount value={price} currency={SITE_CURRENCY} />
      </span>

      {kind === SERVICE_KIND && canBeOrdered({ kind, isAvailable }) ? (
        <Link
          href={detailHref}
          data-testid="card-book-service"
          className={cn(
            "focus-ring mt-2 inline-flex w-fit items-center justify-center rounded-control",
            "bg-pw-green px-2 py-2 text-xs text-white transition-colors hover:bg-pw-green/80",
          )}
        >
          {t("bookSubmit")}
        </Link>
      ) : (
        /* Juntar sin abrir la publicación: el camino real de quien compra productos es recorrer el
           listado y echar al carrito lo que reconoce, no entrar y volver trece veces. Un servicio
           con agenda no pasa por este camino: primero se elige horario en la ficha. */
        <AddToCartButton
          postId={String(id ?? "")}
          kind={kind}
          isAvailable={isAvailable}
          size="xs"
          className="mt-2"
        />
      )}

      {canManage ? (
        <CardOwnerControls
          postId={String(id ?? "")}
          slug={slug ? String(slug) : slugFromUrl(to)}
          kind={kind}
          isAvailable={isAvailable !== false}
          isSellable={isSellable({ kind })}
          stockQuantity={
            typeof stockQuantity === "number" ? stockQuantity : null
          }
          onAvailabilityChange={
            onAvailabilityChange
              ? (available) => onAvailabilityChange(String(id ?? ""), available)
              : undefined
          }
        />
      ) : null}
    </Card>
  );
}
