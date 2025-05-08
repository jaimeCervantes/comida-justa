import { Suspense } from "react";
import PostDetail from "./ui/PostDetail";
import PostDetailSkeleton from "./ui/PostDetailSkeleton";
import { auth } from "~/infra/auth";
import type { PostUser } from "~/infra/types/Posts";

export default async function Slug({ params }: { params: { slug: string } }) {
  const session = await auth();

  return (
    <section className="sm:flex sm:gap-4">
      <Suspense
        fallback={
          <PostDetailSkeleton className="w-full sm:w-[50%]  h-[70vb] sm:h-[85vb] mb-4" />
        }
      >
        <PostDetail
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
