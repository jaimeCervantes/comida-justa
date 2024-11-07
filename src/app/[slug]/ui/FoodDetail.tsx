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
    category,
    comments,
    firstVisibleComment,
    lastVisibleComment,
    id,
  } = details;

  return (
    <article className={className}>
      <h1 className="text-3xl mb-4">{title}</h1>
      <picture className="sm:w-[1000px]">

        <img
          src={image}
          alt={title}
          width={1000}
          height={1000}
          loading="lazy"
          className="h-auto w-full rounded-xl mb-4"
        />
      </picture>
      <section className="flex items-center mb-5">
        <p className="mr-2">Categoria: </p>
        <p className="">{category.name}</p>
      </section>
      <p className="flex items-center mb-2">
        <FaDollarSign className="mr-2" size="24" />
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
      <p className="whitespace-pre-wrap mt-6">{content}</p>
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
