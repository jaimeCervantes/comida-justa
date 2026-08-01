import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildIndexingReport } from "~/domain/entities/post/indexingReport";
import { buildOriginReport } from "~/domain/entities/post/originReport";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import IndexingStatusPanel from "./ui/IndexingStatusPanel";
import OriginReportTable from "./ui/OriginReportTable";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");

  return {
    title: t("productsMetaTitle", { brand: PUBLIC_BRAND_NAME }),
    description: t("productsMetaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ProductosPorProcedenciaPage({
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

  const postRepo = createPostQueryRepository();
  const [originCounts, indexingCounts] = await Promise.all([
    postRepo.getProductCountsByOrigin(),
    postRepo.getProductIndexingCounts(),
  ]);

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("originReportHeading")}</h1>

      <p className="mb-6 text-gray-600 dark:text-gray-400">
        {t.rich("originReportIntro", {
          b: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>

      <OriginReportTable {...buildOriginReport(originCounts)} />

      <hr className="my-8 border-gray-200 dark:border-gray-800" />

      <IndexingStatusPanel {...buildIndexingReport(indexingCounts)} />
    </main>
  );
}
