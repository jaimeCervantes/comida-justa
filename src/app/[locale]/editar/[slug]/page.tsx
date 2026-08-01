import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { optionsFor } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createPostAdminRepository } from "~/infra/dataAccess/managePost/factory";
import { updatePost } from "./actions";
import EditPostForm from "./ui/EditPostForm";

export const metadata: Metadata = {
  title: "Editar publicación",
  // Es una pantalla de administración: no hay nada que indexar.
  robots: { index: false, follow: false },
};

export default async function EditarPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const { locale, slug } = await params;
  const userId = (session.user as User | undefined)?.id;
  const post = await createPostAdminRepository().findBySlug(slug);

  // 404 y no 403 a quien no es su dueño: la existencia de una publicación es pública, pero que
  // exista una pantalla para editarla no tiene por qué revelarse. Mismo criterio que /admin.
  if (!post || post.ownerId !== userId) {
    notFound();
  }

  const taxonomy = await getCategoryTaxonomy();
  const categoryOptions = optionsFor(taxonomy, null, locale);
  const subCategoryOptionsByCategory = Object.fromEntries(
    categoryOptions.map(({ value }) => [
      value,
      optionsFor(taxonomy, value, locale),
    ]),
  );

  return (
    <EditPostForm
      action={updatePost}
      post={{
        slug: post.slug,
        title: post.title,
        content: post.content,
        price: post.price,
        kind: post.kind,
        category: post.category,
        subCategory: post.subCategory,
      }}
      categoryOptions={categoryOptions}
      subCategoryOptionsByCategory={subCategoryOptionsByCategory}
    />
  );
}
