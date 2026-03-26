import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import { Post } from "~/infra/types/Posts";
import { MdPhone } from "react-icons/md";
import { FaDollarSign } from "react-icons/fa";
import { getOnePostWithPaginatedComments } from "~/infra/dataAccess/getOnePostWithPaginatedComments";
import { Suspense } from "react";
import CommentList from "../loadComments/CommentList";
import type { PostUser } from "~/infra/types/Posts";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import { notFound } from "next/navigation";
import { mapOnePostToCard } from "~/infra/UI/mappers/posts/mapPostsToCards";

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
  const postDetails: Post | { error: boolean; errorMessage: string } =
    await getPostDetails(slug);

  if (postDetails.error === true) {
    notFound();
  }

  const details = {
    title: postDetails.translations?.es?.title ?? postDetails.title,
    content: postDetails.translations?.es?.content ?? postDetails.content,
    media: postDetails.media,
    price: postDetails.price,
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
