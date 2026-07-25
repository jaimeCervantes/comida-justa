import { notFound } from "next/navigation";
import PostDetail from "./ui/PostDetail";
import { getPostDetails } from "./data";
import { auth } from "~/infra/auth";
import type { PostUser } from "~/infra/types/Posts";

export default async function Slug({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const session = await auth();
  const { slug, locale } = await params;

  // Se resuelve aquí, fuera de cualquier `<Suspense>`: si la publicación no existe, la respuesta
  // debe salir con status 404 y no con un 200 que solo "parece" un 404. Dentro de un boundary,
  // el shell ya se envió y el status queda congelado en 200.
  const post = await getPostDetails(slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="sm:flex sm:gap-4">
      <PostDetail
        post={post}
        slug={slug}
        className="sm:w-[50%] mb-4"
        user={session?.user as PostUser}
        locale={locale}
      />
      <aside>
        <h2 className="text-3xl font-bold">Comida Relacionada</h2>
      </aside>
    </section>
  );
}
