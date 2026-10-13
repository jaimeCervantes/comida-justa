import { getTranslations } from "next-intl/server";
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
      <h1 className="text-xl font-bold mb-4">{t("newGroupHeading")}</h1>
      <ChannelForm label={t("newGroupHeading")} />
    </main>
  );
}
