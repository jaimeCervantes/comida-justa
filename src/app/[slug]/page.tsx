import { Suspense } from "react";
import FoodDetail from "./ui/FoodDetail";
import FoodDetailSkeleton from "./ui/FoodDetailSkeleton";
import { auth } from "~/auth";
import type { PostUser } from "~/types/Posts";

export default async function Slug({ params }: { params: { slug: string } }) {
  const session = await auth();
  console.log(session);

  return (
    <section className="sm:flex sm:gap-4">
      <Suspense
        fallback={
          <FoodDetailSkeleton className="w-full sm:w-[50%]  h-[70vb] sm:h-[85vb] mb-4" />
        }
      >
        <FoodDetail
          slug={params.slug}
          className="sm:w-[50%] mb-4"
          user={session?.user as PostUser}
        />
      </Suspense>
      <aside>
        <h2 className="text-3xl font-bold">Comida Relacionada</h2>
      </aside>
    </section>
  );
}
