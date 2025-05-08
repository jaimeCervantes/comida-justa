import CurrencyAmount from "~/infra/components/ui/CurrencyAmount";
import { Post } from "~/infra/types/Posts";
import { MdPhone } from "react-icons/md";
import { FaDollarSign } from "react-icons/fa";
import { getOnePostWithPaginatedComments } from "~/infra/dataAccess/getOnePostWithPaginatedComments";
import { Suspense } from "react";
import CommentList from "../loadComments/CommentList";
import type { PostUser } from "~/infra/types/Posts";
import MediaContent from "~/infra/components/ui/MediaContent/MediaContent";

async function getPostDetails(slug: string) {
  return await getOnePostWithPaginatedComments(slug, 10);
}

export default async function PostDetail({
  slug,
  className,
  user,
}: {
  slug: string;
  className: string;
  user: PostUser | undefined;
}) {
  const details: Post = await getPostDetails(slug);
  const {
    title,
    media,
    price,
    content,
    contactInfo,
    comments,
    firstVisibleComment,
    lastVisibleComment,
    id,
  } = details;

  return (
    <article className={className}>
      <h1 className="text-3xl mb-4">{title}</h1>
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
            firstVisibleComment={firstVisibleComment}
            lastVisibleComment={lastVisibleComment}
          />
        </Suspense>
      </section>
    </article>
  );
}
