import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { optionsFor } from "~/domain/entities/post/taxonomy";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import CategoryTree from "./ui/CategoryTree";
import NewCategoryForm from "./ui/NewCategoryForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");

  return {
    title: t("catalogMetaTitle", { brand: PUBLIC_BRAND_NAME }),
    description: t("catalogMetaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CatalogoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));
  const t = await getTranslations("admin");

  const session = await auth();

  // 404 en vez de 403: una página interna no tiene por qué revelar que existe.
  if (!isAdmin(session?.user?.email)) {
    notFound();
  }

  const taxonomy = await getCategoryTaxonomy();
  const nodes = [...taxonomy.nodes.values()];

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("catalogHeading")}</h1>

      <p className="mb-6 text-text-support">
        {t.rich("catalogIntro", { b: (chunks) => <strong>{chunks}</strong> })}
      </p>

      <CategoryTree nodes={nodes} />

      <NewCategoryForm roots={optionsFor(taxonomy, null, "es")} />
    </main>
  );
}
