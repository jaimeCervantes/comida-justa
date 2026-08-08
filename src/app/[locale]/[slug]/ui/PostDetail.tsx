import { getTranslations } from "next-intl/server";
import { FaDollarSign } from "react-icons/fa";
import { MdPhone } from "react-icons/md";
import { canBeOrdered, isSellable } from "~/domain/entities/post/availability";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import { buildWhatsappOrderLink } from "~/domain/entities/post/whatsappOrder";
import { routing } from "~/i18n/routing";
import { PUBLIC_BASE_URL, SITE_CURRENCY } from "~/infra/constants";
import type { Post, PostUser } from "~/infra/types/Posts";
import ShareLocationButton from "~/presentation/location/ShareLocationButton";
import StoreDistance from "~/presentation/location/StoreDistance";
import MediaContent from "~/presentation/media/MediaContent/MediaContent";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import { setAvailability } from "~/presentation/post/availabilityAction";
import CategoryTag from "~/presentation/post/CategoryTag/CategoryTag";
import OpenStoreHint from "~/presentation/post/OpenStoreHint";
import ProvenanceBadge, {
  showsProvenanceBadge,
} from "~/presentation/post/ProvenanceBadge";
import SoldOutBadge from "~/presentation/post/SoldOutBadge/SoldOutBadge";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";
import { postCategoryLabel } from "../categoryLabel";
import OwnerControls from "./OwnerControls";
import PostIdentity from "./PostIdentity";
import PostLinks from "./PostLinks";

/**
 * Presenta una publicación ya cargada. La búsqueda (y el 404 si no existe) vive en la página,
 * fuera de cualquier `<Suspense>`, para que el status HTTP sea el correcto.
 *
 * **Los comentarios ya no viven aquí.** Los compone la página, porque su sitio depende del ancho:
 * en móvil van después del mapa de la tienda y en escritorio quedan debajo de las dos columnas.
 * Un componente que se pinta dentro de este no puede colocarse fuera de él.
 */
export default async function PostDetail({
  post: postDetails,
  className,
  user,
  locale,
  slug,
  distanceMeters = null,
}: {
  post: Post;
  className: string;
  user: PostUser | undefined;
  /**
   * A cuántos metros está la tienda de quien mira, o `null` cuando no lo sabemos —porque la tienda
   * no dio ubicación, o porque quien mira no la compartió—. La resuelve la página: este componente
   * no consulta nada.
   */
  distanceMeters?: number | null;
  /** Idioma de la ruta; decide en qué idioma se lee la etiqueta de categoría. */
  locale?: string;
  /** El de la ruta: es lo que se manda en el mensaje de WhatsApp para identificar el producto. */
  slug?: string;
}) {
  const t = await getTranslations("post");
  const translation = resolvePostTranslation(
    postDetails.translations,
    locale ?? routing.defaultLocale,
    routing.defaultLocale,
  );
  const details = {
    title: translation?.title ?? postDetails.title,
    content: translation?.content ?? postDetails.content,
    /**
     * El texto alternativo sale de la traducción, no de la columna.
     *
     * `post_media.alt` no tiene idioma —hay una fila por archivo, no por traducción— y al publicar
     * se rellena con el título español (`publicar/actions.ts:186`), descartando cualquier cosa que
     * hubiera escrito quien publica. O sea que siempre **fue** el título. Derivarlo aquí es
     * equivalente y además lo traduce, sin migración: quien lee con lector de pantalla en inglés
     * deja de oír el título en español.
     */
    media: postDetails.media[0]
      ? {
          ...postDetails.media[0],
          alt: translation?.title ?? postDetails.media[0].alt,
        }
      : { url: "", type: "", alt: "" },
    price: postDetails.price,
    kind: postDetails.kind,
    origin: postDetails.origin,
    category: postDetails.category,
    subCategory: postDetails.subCategory,
    contactInfo: postDetails.contactInfo,
    id: postDetails.id,
    isAvailable: postDetails.isAvailable !== false,
    seller: postDetails.seller,
  };

  const {
    title,
    content,
    media,
    price,
    kind,
    origin,
    category,
    subCategory,
    contactInfo,
    id,
    isAvailable,
    seller,
  } = details;

  // Solo se ofrece pedir lo que se vende y sigue habiendo: mandar a WhatsApp por algo agotado
  // empieza la conversación con una decepción.
  const orderLink = canBeOrdered({ kind, isAvailable })
    ? buildWhatsappOrderLink({
        title: String(title ?? ""),
        price,
        url: `${PUBLIC_BASE_URL}/${slug ?? ""}`,
        whatsapp: contactInfo?.whatsapp,
        phone: contactInfo?.phone,
      })
    : null;

  const isOwner = Boolean(user?.id) && user?.id === postDetails.user?.id;

  const categoryLabel = await postCategoryLabel(category, subCategory, locale);

  /* El `data-testid` de la raíz permite que una prueba distinga la ficha de las tarjetas
     relacionadas, que pintan exactamente las mismas insignias. */
  return (
    <article className={className} data-testid="post-detail">
      <h1 className="text-3xl mb-4">{title}</h1>

      <p
        className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-label"
        data-testid="post-identity"
      >
        <PostIdentity seller={seller} author={postDetails.user} />

        {/* Se calla cuando el logo de al lado ya lo dijo: ver `provenanceVisibility.ts`. */}
        {showsProvenanceBadge(origin, Boolean(seller)) ? (
          <ProvenanceBadge origin={origin} />
        ) : null}
        <CategoryTag label={categoryLabel} />
        <SoldOutBadge kind={kind} isAvailable={isAvailable} />
        {/* Solo cuando las dos partes dieron ubicación: si falta una, no se pinta nada y quien
            mira puede compartir la suya desde aquí mismo. */}
        {distanceMeters === null ? (
          isSellable({ kind }) ? (
            <ShareLocationButton size="xs" />
          ) : null
        ) : (
          <StoreDistance meters={distanceMeters} />
        )}
      </p>
      <MediaContent media={media} className="h-auto mb-4" />
      <p className="flex items-center mb-2">
        {price ? <FaDollarSign className="mr-2" size="24" /> : null}
        <CurrencyAmount value={price} currency={SITE_CURRENCY} />
      </p>
      <p className="flex items-center">
        <MdPhone className="mr-2" size="24" />
        <a
          href={`tel:${contactInfo?.phone}`}
          className="font-bold text-pw-orange"
        >
          {contactInfo?.phone}
        </a>
      </p>

      <WhatsappButton href={orderLink} className="mt-4" testId="whatsapp-order">
        {t("orderOnWhatsapp")}
      </WhatsappButton>

      {isOwner ? (
        <>
          <OwnerControls
            action={setAvailability}
            postId={String(id ?? "")}
            slug={slug ?? ""}
            isAvailable={isAvailable}
            isSellable={isSellable({ kind })}
          />
          {/* Publicó sin tienda: es el momento en que el consejo sirve, con la tarea ya hecha. */}
          {seller ? null : <OpenStoreHint className="mt-4" />}
        </>
      ) : null}
      <section className="whitespace-pre-wrap mt-6">{content}</section>

      <PostLinks
        categoryKey={subCategory ?? category}
        categoryLabel={categoryLabel}
        seller={seller}
        author={postDetails.user}
      />
    </article>
  );
}
