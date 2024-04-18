import { getPost } from "~/firebase/models/posts";
import CurrencyAmount from "~/components/ui/CurrencyAmount";

async function getFoodDetails(slug: string) {
  return await getPost(slug);
}

export default async function Slug({ params, searchParams }) {
  const details = await getFoodDetails(params.slug);

  const { title, image, price, content } = details;

  return (
    <article>
      <h1 className="text-3xl mb-4">{title}</h1>
      <figure className="w-[500px]">
        <img
          src={image}
          alt={title}
          width={500}
          height={500}
          loading="lazy"
          className="h-auto rounded-xl"
        />
      </figure>

      <CurrencyAmount value={price} locale="es-MX" currency="MXN" />
      <p className="whitespace-pre">{content}</p>
    </article>
  );
}
