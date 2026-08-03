import { getTranslations } from "next-intl/server";
import { FaDollarSign } from "react-icons/fa";
import { MdPhone } from "react-icons/md";
import { canBeOrdered, isSellable } from "~/domain/entities/post/availability";
import { buildWhatsappOrderLink } from "~/domain/entities/post/whatsappOrder";
import { PUBLIC_BASE_URL, SITE_CURRENCY } from "~/infra/constants";
import type { Post, PostUser } from "~/infra/types/Posts";
import CategoryTag from "~/infra/UI/components/CategoryTag/CategoryTag";
import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import ProvenanceBadge from "~/infra/UI/components/ProvenanceBadge";
import SoldOutBadge from "~/infra/UI/components/SoldOutBadge/SoldOutBadge";
import WhatsappButton from "~/infra/UI/components/WhatsappButton/WhatsappButton";
import ShareLocationButton from "~/presentation/location/ShareLocationButton";
import StoreDistance from "~/presentation/location/StoreDistance";
import { setAvailability } from "~/presentation/post/availabilityAction";
import OpenStoreHint from "~/presentation/post/OpenStoreHint";
import { postCategoryLabel } from "../categoryLabel";
import OwnerControls from "./OwnerControls";
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
  const details = {
    title: postDetails.translations?.es?.title ?? postDetails.title,
    content: postDetails.translations?.es?.content ?? postDetails.content,
    media: postDetails.media[0] ?? { url: "", type: "", alt: "" },
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

  return (
    <article className={className}>
      <h1 className="text-3xl mb-4">{title}</h1>
      <p className="flex flex-wrap items-center gap-2 mb-4">
        <ProvenanceBadge origin={origin} />
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
        authorName={postDetails.user?.name}
        authorUsername={postDetails.user?.username}
      />
    </article>
  );
}
