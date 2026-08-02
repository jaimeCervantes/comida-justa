import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildBreadcrumbJsonLd } from "~/domain/seo/jsonLd/breadcrumbs";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import type { PostUser } from "~/infra/types/Posts";
import Breadcrumbs from "~/presentation/navigation/Breadcrumbs";
import JsonLd from "~/presentation/seo/JsonLd";
import { postBreadcrumbs } from "../breadcrumbs";
import { postCategoryLabel } from "./categoryLabel";
import { getPostDetails } from "./data";
import { buildPostStructuredData } from "./jsonLd";
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
  const tCommon = await getTranslations("common");

  // Se resuelve aquí, fuera de cualquier `<Suspense>`: si la publicación no existe, la respuesta
  // debe salir con status 404 y no con un 200 que solo "parece" un 404. Dentro de un boundary,
  // el shell ya se envió y el status queda congelado en 200.
  const post = await getPostDetails(slug);

  if (!post) {
    notFound();
  }

  // Lo que declara el producto es la misma etiqueta que ve quien lo lee.
  const categoryLabel = await postCategoryLabel(
    post.category,
    post.subCategory,
    locale,
  );

  /* Quien llega desde un buscador aterriza aquí sin haber pasado por el catálogo: la miga es su
     única forma de subir, y es lo que permite declarar el `BreadcrumbList`. */
  const title = String(post.translations?.es?.title ?? post.title ?? "");
  const { crumbs, jsonLdItems } = await postBreadcrumbs({
    categoryKey: post.subCategory ?? post.category,
    title,
    homeLabel: tCommon("home"),
    locale,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(jsonLdItems);

  return (
    <section className="sm:flex sm:gap-4 flex-wrap">
      <Breadcrumbs
        items={crumbs}
        ariaLabel={tCommon("breadcrumb")}
        className="w-full mb-3"
      />
      <JsonLd data={buildPostStructuredData(post, slug, categoryLabel)} />
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
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
