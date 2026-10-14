import { getTranslations } from "next-intl/server";
import { enterOutreachAdmin, outreachMetadata } from "../../adminGate";
import OutreachBreadcrumbs from "../../ui/OutreachBreadcrumbs";
import FooterForm from "../ui/FooterForm";

export const generateMetadata = outreachMetadata;

export default async function NuevoPiePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  return (
    <main>
      <OutreachBreadcrumbs inFooters steps={[{ label: t("newFooter") }]} />
      <h1 className="text-xl font-bold mb-4">{t("newFooterHeading")}</h1>
      <FooterForm label={t("newFooterHeading")} />
    </main>
  );
}
