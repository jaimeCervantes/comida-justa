import { getTranslations } from "next-intl/server";
import { Heading } from "~/presentation/design_system/typography/Heading";
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
      <Heading level={1} className="mb-4">
        {t("newFooterHeading")}
      </Heading>
      <FooterForm label={t("newFooterHeading")} />
    </main>
  );
}
