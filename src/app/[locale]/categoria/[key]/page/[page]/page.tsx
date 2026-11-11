import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parseListingFilters } from "~/domain/entities/post/listingFilters";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { getPostsByCategory } from "../../data";
import { buildCategoryMetadata } from "../../metadata";
import CategoryPosts from "../../ui/CategoryPosts";

type Props = {
  params: Promise<{ locale: string; key: string; page: string }>;
  /** Pilar, `disponibles` y `promocion`. Ver `parseListingFilters`. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parsePage(value: string): number | null {
  const page = parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? null : page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key, page: pageStr, locale: rawLocale } = await params;
  const page = parsePage(pageStr);

  if (!page) return {};

  const locale = resolveLocale(rawLocale);
  const data = await getPostsByCategory(key, page, locale);

  return data ? buildCategoryMetadata(key, data.label, { page }) : {};
}

export default async function CategoryPaginatedPage({
  params,
  searchParams,
}: Props) {
  const { key, page: pageStr, locale: rawLocale } = await params;
  const filters = parseListingFilters(await searchParams);
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("category");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const data = await getPostsByCategory(key, page, locale, filters);

  // Ni una categoría inexistente ni una página fuera de rango son contenido.
  if (!data || (data.posts.length === 0 && page > 1)) {
    notFound();
  }

  return (
    <main>
      <Heading level={1} className="mb-2">
        {t("heading", { category: data.label })}
      </Heading>

      <CategoryPosts
        viewerId={viewerId}
        posts={data.posts}
        categoryKey={key}
        label={data.label}
        currentPage={page}
        totalPages={data.totalPages}
        filters={filters}
      />

      <div className="text-center mt-4">
        <Link
          href={{ pathname: "/categoria/[key]", params: { key } }}
          className="text-highlight hover:underline"
        >
          {t("backToCategory", { category: data.label })}
        </Link>
      </div>
    </main>
  );
}
