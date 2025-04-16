import Image from "next/image";
import CurrencyAmount from "~/components/ui/CurrencyAmount";
import { Post } from "~/types/Posts";
import { MdPhone } from "react-icons/md";
import { FaDollarSign } from "react-icons/fa";
import { getPostWithPaginatedComments } from "~/firebase/models/postWithComments";
import { Suspense } from "react";
import CommentList from "../loadComments/CommentList";
import type { PostUser } from "~/types/Posts";

async function getFoodDetails(slug: string) {
  return await getPostWithPaginatedComments(slug, 10);
}

function isVideo(url: string): boolean {
  const ext = url.split(".").pop()?.split("?")[0].toLowerCase();
  return ["mp4", "webm", "ogg"].includes(ext || "");
}

export default async function FoodDetail({
  slug,
  className,
  user,
}: {
  slug: string;
  className: string;
  user: PostUser | undefined;
}) {
  const details: Post = await getFoodDetails(slug);
  const {
    title,
    image,
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
      <picture className="sm:w-[1000px]">
      {isVideo(image) ? (
          <video
            src={image}
            controls
            className="h-auto w-full rounded-xl mb-4"
          >
            Tu navegador no soporta HTML5.
          </video>
        ) : (
        <Image
          src={image}
          alt={title}
          width={1000}
          height={1000}
          loading="lazy"
          className="h-auto w-full rounded-xl mb-4"
        />
        )}
      </picture>
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
