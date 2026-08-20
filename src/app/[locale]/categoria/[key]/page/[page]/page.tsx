import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import LocationBanner from "~/presentation/location/LocationBanner";
import { getPostsByCategory } from "../../data";
import { buildCategoryMetadata } from "../../metadata";
import CategoryPosts from "../../ui/CategoryPosts";

type Props = {
  params: Promise<{ locale: string; key: string; page: string }>;
  searchParams: Promise<{ pillar?: string }>;
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
  const data = await getPostsByCategory(key, page, locale, null);

  return data ? buildCategoryMetadata(key, data.label, { page }) : {};
}

export default async function CategoryPaginatedPage({
  params,
  searchParams,
}: Props) {
  const { key, page: pageStr, locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("category");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const data = await getPostsByCategory(key, page, locale, currentPillar);

  // Ni una categoría inexistente ni una página fuera de rango son contenido.
  if (!data || (data.posts.length === 0 && page > 1)) {
    notFound();
  }

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">
        {t("heading", { category: data.label })}
      </h1>

      <LocationBanner showSellerCta={data.showSellerCta} />

      <CategoryPosts
        viewerId={viewerId}
        posts={data.posts}
        categoryKey={key}
        label={data.label}
        currentPage={page}
        totalPages={data.totalPages}
        currentPillar={currentPillar}
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
