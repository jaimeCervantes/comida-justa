import { Suspense } from "react";
import FoodDetail from "./FoodDetail";
import FoodDetailSkeleton from "./FoodDetailSkeleton";

export default async function Slug({ params }: { params: { slug: string } }) {
  return (
    <section className="sm:flex sm:gap-4">
      <Suspense
        fallback={
          <FoodDetailSkeleton className="w-full sm:w-[50%]  h-[70vb] sm:h-[85vb] mb-4" />
        }
      >
        <FoodDetail slug={params.slug} className="sm:w-[50%] mb-4" />
      </Suspense>
      <aside>
        <h2 className="text-3xl font-bold">Comida Relacionada</h2>
      </aside>
    </section>
  );
}
