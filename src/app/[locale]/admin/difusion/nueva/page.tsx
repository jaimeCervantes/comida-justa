import { getTranslations } from "next-intl/server";
import { createOutreachFooterRepository } from "~/infra/dataAccess/outreach/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { enterOutreachAdmin, outreachMetadata } from "../adminGate";
import OutreachBreadcrumbs from "../ui/OutreachBreadcrumbs";
import OutreachTextForm from "../ui/OutreachTextForm";

export const generateMetadata = outreachMetadata;

export default async function NuevaDifusionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  const footers = await createOutreachFooterRepository().list();

  return (
    <main>
      <OutreachBreadcrumbs steps={[{ label: t("newText") }]} />
      <Heading level={1} className="mb-4">
        {t("newHeading")}
      </Heading>
      <OutreachTextForm label={t("newHeading")} footers={footers} />
    </main>
  );
}
