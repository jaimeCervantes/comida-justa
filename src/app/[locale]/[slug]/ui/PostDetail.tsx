import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import { Post } from "~/infra/types/Posts";
import { MdPhone } from "react-icons/md";
import { FaDollarSign } from "react-icons/fa";
import { Suspense } from "react";
import CommentList from "../loadComments/CommentList";
import type { PostUser } from "~/infra/types/Posts";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import ProvenanceBadge from "~/infra/UI/components/ProvenanceBadge";
import CategoryTag from "~/infra/UI/components/CategoryTag/CategoryTag";

/**
 * Presenta una publicación ya cargada. La búsqueda (y el 404 si no existe) vive en la página,
 * fuera de cualquier `<Suspense>`, para que el status HTTP sea el correcto.
 */
export default function PostDetail({
  post: postDetails,
  slug,
  className,
  user,
  locale,
}: {
  post: Post;
  slug: string;
  className: string;
  user: PostUser | undefined;
  /** Idioma de la ruta; decide en qué idioma se lee la etiqueta de categoría. */
  locale?: string;
}) {
  const details = {
    title: postDetails.translations?.es?.title ?? postDetails.title,
    content: postDetails.translations?.es?.content ?? postDetails.content,
    media: postDetails.media[0] ?? { url: "", type: "", alt: "" },
    price: postDetails.price,
    origin: postDetails.origin,
    category: postDetails.category,
    subCategory: postDetails.subCategory,
    contactInfo: postDetails.contactInfo,
    comments: postDetails.comments,
    firstVisibleComment: postDetails.firstVisibleComment,
    lastVisibleComment: postDetails.lastVisibleComment,
    id: postDetails.id,
  };

  const {
    title,
    content,
    media,
    price,
    origin,
    category,
    subCategory,
    contactInfo,
    comments,
    firstVisibleComment,
    lastVisibleComment,
    id,
  } = details;

  return (
    <article className={className}>
      <h1 className="text-3xl mb-4">{title}</h1>
      <p className="flex flex-wrap items-center gap-2 mb-4">
        <ProvenanceBadge origin={origin} />
        <CategoryTag
          category={category}
          subCategory={subCategory}
          locale={locale}
        />
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
      <section className="whitespace-pre-wrap mt-6">{content}</section>
      <section className="mt-14">
        <Suspense>
          <CommentList
            postId={id}
            slug={slug}
            user={user}
            initialComments={comments}
          />
        </Suspense>
      </section>
    </article>
  );
}
