import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import type { PostUser } from "~/infra/types/Posts";
import { getPostDetails } from "./data";
import { buildPostMetadata } from "./metadata";
import PostDetail from "./ui/PostDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostDetails(slug);

  // Sin publicación no hay nada que anunciar: la página responde 404 y el layout pone lo suyo.
  return post ? buildPostMetadata(post, slug) : {};
}

export default async function Slug({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const session = await auth();
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("post");

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
        className="sm:w-[50%] mb-4"
        user={session?.user as PostUser}
        locale={locale}
        slug={slug}
      />
      <aside>
        <h2 className="text-3xl font-bold">{t("related")}</h2>
      </aside>
    </section>
  );
}
