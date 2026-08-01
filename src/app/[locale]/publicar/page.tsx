import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { optionsFor } from "~/domain/entities/post/taxonomy";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { SIGNIN_PATH } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { NOINDEX_METADATA } from "~/infra/UI/metadata/noindex";
import { createPost } from "./actions";
import PublishForm from "./PublishForm";

/** Exige sesión: para un rastreador es una redirección al login, no contenido. */
export const metadata: Metadata = NOINDEX_METADATA;

export default async function PublicarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();

  if (!session) {
    return redirect(SIGNIN_PATH);
  }

  const { locale } = await params;
  const taxonomy = await getCategoryTaxonomy();

  // El formulario es un Client Component: las opciones se resuelven aquí y bajan como datos.
  // Van agrupadas por categoría porque los selectores se encadenan — el FK compuesto de `posts`
  // rechaza una sub-categoría que no cuelgue de la categoría elegida.
  const categoryOptions = optionsFor(taxonomy, null, locale);
  const subCategoryOptionsByCategory = Object.fromEntries(
    categoryOptions.map(({ value }) => [
      value,
      optionsFor(taxonomy, value, locale),
    ]),
  );

  return (
    <PublishForm
      action={createPost}
      isAdmin={isAdmin(session.user?.email)}
      categoryOptions={categoryOptions}
      subCategoryOptionsByCategory={subCategoryOptionsByCategory}
    />
  );
}
