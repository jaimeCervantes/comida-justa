import { Suspense } from "react";
import { FaDollarSign } from "react-icons/fa";
import { MdPhone } from "react-icons/md";
import { PRODUCT_KIND } from "~/domain/entities/post/hazloSanoProduct";
import { labelFor } from "~/domain/entities/post/taxonomy";
import { buildWhatsappOrderLink } from "~/domain/entities/post/whatsappOrder";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import type { Post, PostUser } from "~/infra/types/Posts";
import CategoryTag from "~/infra/UI/components/CategoryTag/CategoryTag";
import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import ProvenanceBadge from "~/infra/UI/components/ProvenanceBadge";
import WhatsappButton from "~/infra/UI/components/WhatsappButton/WhatsappButton";
import CommentList from "../loadComments/CommentList";

/**
 * Presenta una publicación ya cargada. La búsqueda (y el 404 si no existe) vive en la página,
 * fuera de cualquier `<Suspense>`, para que el status HTTP sea el correcto.
 */
export default async function PostDetail({
  post: postDetails,
  className,
  user,
  locale,
  slug,
}: {
  post: Post;
  className: string;
  user: PostUser | undefined;
  /** Idioma de la ruta; decide en qué idioma se lee la etiqueta de categoría. */
  locale?: string;
  /** El de la ruta: es lo que se manda en el mensaje de WhatsApp para identificar el producto. */
  slug?: string;
}) {
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
    comments: postDetails.comments,
    id: postDetails.id,
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
    comments,
    id,
  } = details;

  // Solo lo que se vende ofrece pedido; un anuncio no tiene nada que encargar.
  const orderLink =
    kind === PRODUCT_KIND
      ? buildWhatsappOrderLink({
          title: String(title ?? ""),
          price,
          url: `${PUBLIC_BASE_URL}/${slug ?? ""}`,
          whatsapp: contactInfo?.whatsapp,
          phone: contactInfo?.phone,
        })
      : null;

  // La sub-categoría gana sobre la categoría por ser la más específica.
  const taxonomy = await getCategoryTaxonomy();
  const categoryLabel =
    labelFor(taxonomy, subCategory, locale) ??
    labelFor(taxonomy, category, locale);

  return (
    <article className={className}>
      <h1 className="text-3xl mb-4">{title}</h1>
      <p className="flex flex-wrap items-center gap-2 mb-4">
        <ProvenanceBadge origin={origin} />
        <CategoryTag label={categoryLabel} />
      </p>
      <MediaContent media={media} className="h-auto mb-4" />
      <p className="flex items-center mb-2">
        {price ? <FaDollarSign className="mr-2" size="24" /> : null}
        <CurrencyAmount value={price} locale="es-MX" currency="MXN" />
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
        Pedir por WhatsApp
      </WhatsappButton>
      <section className="whitespace-pre-wrap mt-6">{content}</section>
      <section className="mt-14">
        <Suspense>
          <CommentList postId={id} user={user} initialComments={comments} />
        </Suspense>
      </section>
    </article>
  );
}
