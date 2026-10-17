import { getTranslations } from "next-intl/server";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { enterOutreachAdmin, outreachMetadata } from "../../adminGate";
import OutreachBreadcrumbs from "../../ui/OutreachBreadcrumbs";
import ChannelForm from "../ui/ChannelForm";

export const generateMetadata = outreachMetadata;

export default async function NuevoGrupoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  return (
    <main>
      <OutreachBreadcrumbs inGroups steps={[{ label: t("newGroup") }]} />
      <Heading level={1} className="mb-4">
        {t("newGroupHeading")}
      </Heading>
      <ChannelForm label={t("newGroupHeading")} />
    </main>
  );
}
