import Link from "next/link";

import Card from "~/components/ui/Card";
import CurrencyAmount from "~/components/ui/CurrencyAmount";
import { getPosts } from "~/firebase/models/posts";
import { mapPostsToCards } from "~/mappers/posts/mapPostsToCards";
import { Post } from "~/types/Posts";

async function getFoods() {
  const result = await getPosts();

  return { ...result, foods: mapPostsToCards(result.posts) };
}

export default async function Inicio() {
  const { foods } = await getFoods();

  return (
    <main className="">
      <h1 className="text-xl font-bold">
        Comida Justa: ¿Como evitar enfermedades, ahorrar tiempo y dinero, al
        mismo tiempo que apoyas al medio ambiente y a tu comunidad?
      </h1>
      <section
        className="grid grid-flow-dense gap-4  pt-6 max-sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))]"
        style={{}}
      >
        {foods.length === 0 ? (
          <p>No hay comidas publicadas aún.</p>
        ) : (
          <>
            {foods.map(
              ({
                id,
                title,
                image,
                createdAt,
                createdAtLocale,
                price,
                user,
                to,
              }: Post & { createdAtLocale: string; to: string }) => {
                return (
                  <Card
                    key={id}
                    title={title}
                    image={image}
                    createdAt={createdAt}
                    createdAtLocale={createdAtLocale}
                    user={user}
                    className="flex flex-col justify-between bg-white dark:bg-pw-gray rounded-3xl overflow-hidden hover:border-b-pw-lightgreen dark:border-t-0 dark:border-r-0 dark:border-l-0 border-b-8 border-b-transparent"
                    AnchorElement={Link}
                    anchorProps={{ href: to, title: title }}
                  >
                    <CurrencyAmount
                      value={price}
                      locale="es-MX"
                      currency="MXN"
                    ></CurrencyAmount>
                  </Card>
                );
              }
            )}
          </>
        )}
      </section>
    </main>
  );
}
