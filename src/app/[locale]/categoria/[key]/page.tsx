import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import { buildBreadcrumbJsonLd } from "~/domain/seo/jsonLd/breadcrumbs";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import Breadcrumbs from "~/presentation/navigation/Breadcrumbs";
import JsonLd from "~/presentation/seo/JsonLd";
import { categoryBreadcrumbs } from "../../breadcrumbs";
import { getPostsByCategory } from "./data";
import { buildCategoryMetadata } from "./metadata";
import CategoryPosts from "./ui/CategoryPosts";

type Props = {
  params: Promise<{ locale: string; key: string }>;
  searchParams: Promise<{ pillar?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const data = await getPostsByCategory(
    key,
    PAGINATION_INIT_PAGE,
    locale,
    null,
  );

  // Sin categoría no hay metadata que construir: la página va a responder 404.
  return data
    ? buildCategoryMetadata(key, data.label, { isEmpty: data.total === 0 })
    : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { key, locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("category");
  const tCommon = await getTranslations("common");

  const data = await getPostsByCategory(
    key,
    PAGINATION_INIT_PAGE,
    locale,
    currentPillar,
  );

  /* Una clave que no existe (o que se desactivó desde `/admin/catalogo`) es un 404, no una lista
     vacía: si respondiera 200 con cero resultados, un buscador indexaría una página hueca por cada
     palabra que alguien inventara en la URL. */
  if (!data) {
    notFound();
  }

  const { crumbs, jsonLdItems } = await categoryBreadcrumbs(
    key,
    tCommon("home"),
    locale,
  );
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(jsonLdItems);

  return (
    <main>
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
      <Breadcrumbs
        items={crumbs}
        ariaLabel={tCommon("breadcrumb")}
        className="mb-3"
      />

      <h1 className="text-xl font-bold mb-2">
        {t("heading", { category: data.label })}
      </h1>

      <p className="mb-2">{t("count", { total: data.total })}</p>

      <CategoryPosts
        viewerId={viewerId}
        posts={data.posts}
        categoryKey={key}
        label={data.label}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={data.totalPages}
        currentPillar={currentPillar}
      />
    </main>
  );
}
