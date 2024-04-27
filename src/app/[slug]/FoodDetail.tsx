import { getPost } from "~/firebase/models/posts";
import CurrencyAmount from "~/components/ui/CurrencyAmount";
import { Post } from "~/types/Posts";

async function getFoodDetails(slug: string) {
  return await getPost(slug);
}

export default async function FoodDetail({
  slug,
  className,
}: {
  slug: string;
  className: string;
}) {
  const details: Post = await getFoodDetails(slug);

  const { title, image, price, content } = details;

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

      <CurrencyAmount value={price} locale="es-MX" currency="MXN" />
      <p className="whitespace-pre-wrap">{content}</p>
    </article>
  );
}
