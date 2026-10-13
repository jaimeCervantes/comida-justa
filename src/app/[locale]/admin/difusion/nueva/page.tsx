import { getTranslations } from "next-intl/server";
import { routing } from "~/i18n/routing";
import { createOutreachProductCatalog } from "~/infra/dataAccess/outreach/factory";
import { enterOutreachAdmin, outreachMetadata } from "../adminGate";
import OutreachBreadcrumbs from "../ui/OutreachBreadcrumbs";
import OutreachTextForm from "../ui/OutreachTextForm";

export const generateMetadata = outreachMetadata;

export default async function NuevaDifusionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  const products = await createOutreachProductCatalog().listProducts({
    locale,
    fallbackLocale: routing.defaultLocale,
  });

  return (
    <main>
      <OutreachBreadcrumbs steps={[{ label: t("newText") }]} />
      <h1 className="text-xl font-bold mb-4">{t("newHeading")}</h1>
      <OutreachTextForm label={t("newHeading")} products={products} />
    </main>
  );
}
