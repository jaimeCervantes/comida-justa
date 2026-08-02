import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import { getPostsByCategory } from "./data";
import { buildCategoryMetadata } from "./metadata";
import CategoryPosts from "./ui/CategoryPosts";

type Props = {
  params: Promise<{ locale: string; key: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const data = await getPostsByCategory(key, PAGINATION_INIT_PAGE, locale);

  // Sin categoría no hay metadata que construir: la página va a responder 404.
  return data ? buildCategoryMetadata(key, data.label) : {};
}

export default async function CategoryPage({ params }: Props) {
  const { key, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("category");

  const data = await getPostsByCategory(key, PAGINATION_INIT_PAGE, locale);

  /* Una clave que no existe (o que se desactivó desde `/admin/catalogo`) es un 404, no una lista
     vacía: si respondiera 200 con cero resultados, un buscador indexaría una página hueca por cada
     palabra que alguien inventara en la URL. */
  if (!data) {
    notFound();
  }

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">
        {t("heading", { category: data.label })}
      </h1>

      <p className="mb-2">{t("count", { total: data.total })}</p>

      <CategoryPosts
        posts={data.posts}
        categoryKey={key}
        label={data.label}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={data.totalPages}
      />
    </main>
  );
}
