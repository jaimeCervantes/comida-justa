import Link from "next/link";
import FoodListClient from "~/components/FoodListClient";

import Card from "~/components/ui/Card";
import CurrencyAmount from "~/components/ui/CurrencyAmount";
import MediaContent from "~/components/ui/MediaContent/MediaContent";
import { getPosts } from "~/firebase/models/posts";
import { mapPostsToCards } from "~/mappers/posts/mapPostsToCards";
import { Post } from "~/types/Posts";

  const result = await getPosts();
  const foods = mapPostsToCards (result.posts);

export default function Inicio() {

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
                media,
                createdAt,
                createdAtLocale,
                price, 
                user,
                to,
              }: Post & { createdAtLocale: string; to: string }) => {
                const isVideo = media.url.includes(".mp4");
                return (
                  <Card
                    key={id}
                    title={title}
                    media={{
                      url: media.url,
                      alt: media.alt,
                    }}
                    fileType={isVideo ? "video/mp4" : "image/jpeg" }
                    createdAt={createdAt}
                    createdAtLocale={createdAtLocale}
                    user={user}
                    className="flex flex-col justify-between bg-white dark:bg-pw-gray rounded-3xl overflow-hidden hover:border-b-pw-lightgreen dark:border-t-0 dark:border-r-0 dark:border-l-0 border-b-8 border-b-transparent"
                    AnchorElement={Link}
                    anchorProps={{ href: to, title: title }}
                    middleFooter={
                    <CurrencyAmount
                      value={price}
                      locale="es-MX"
                      currency="MXN"
                    />
                    }
                  > 
                
                    <MediaContent
                     
                     media={{
                      type: isVideo ? "video" : "image",
                      url: media.url,
                      alt: media.alt,
                    }}
                    options={{
                      imageProps: {
                        width: media.width ?? 300,
                        height: media.height ?? 300,
                        loading: media.loading ?? "lazy",
                        className: "h-auto max-w-full w-full object-cover aspect-video"
                      },
                      videoProps: {
                        width: media.width ?? 300,
                        height: media.height ?? 300,
                        className: "h-auto max-w-full w-full object-cover aspect-video",
                        controls: true
                      }
                    }}
                      />                
                  </Card>
                )
             )}

          </>
        )}
      </section>
    </main>
  );
}
