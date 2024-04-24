import { getPost } from "~/firebase/models/posts";
import CurrencyAmount from "~/components/ui/CurrencyAmount";
import { Post } from "~/types/Posts";

async function getFoodDetails(slug: string) {
  return await getPost(slug);
}

export default async function Slug({ params }: { params: { slug: string } }) {
  const details: Post = await getFoodDetails(params.slug);

  const { title, image, price, content } = details;

  return (
    <article>
      <h1 className="text-3xl mb-4">{title}</h1>
      <picture className="w-[500px]">
        <img
          src={image}
          alt={title}
          width={500}
          height={500}
          loading="lazy"
          className="h-auto rounded-xl"
        />
      </picture>

      <CurrencyAmount value={price} locale="es-MX" currency="MXN" />
      <p className="whitespace-pre">{content}</p>
    </article>
  );
}
