import { Suspense } from "react";
import PostDetail from "./ui/PostDetail";
import PostDetailSkeleton from "./ui/PostDetailSkeleton";
import { auth } from "~/infrastructure/auth";
import type { PostUser } from "~/infrastructure/types/Posts";

export default async function Slug({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;

  return (
    <section className="sm:flex sm:gap-4">
      <Suspense
        fallback={
          <PostDetailSkeleton className="w-full sm:w-[50%]  h-[70vb] sm:h-[85vb] mb-4" />
        }
      >
        <PostDetail
          slug={slug}
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
