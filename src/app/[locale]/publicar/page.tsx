import type { Metadata } from "next";
import { getLocale, setRequestLocale } from "next-intl/server";
import { optionsFor } from "~/domain/entities/post/taxonomy";
import type { User } from "~/domain/entities/post/types";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { SIGNIN_PATH } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
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
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
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

  // Decide si al declararse productor se le avisa de que sin tienda esa declaración no cuenta.
  const userId = (session.user as User | undefined)?.id;
  const hasStore = Boolean(
    userId ? await createSellerRepository().findByUserId(userId) : null,
  );

  return (
    <PublishForm
      action={createPost}
      isAdmin={isAdmin(session.user?.email)}
      hasStore={hasStore}
      categoryOptions={categoryOptions}
      subCategoryOptionsByCategory={subCategoryOptionsByCategory}
    />
  );
}
