import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createOutreachChannelRepository } from "~/infra/dataAccess/outreach/factory";
import { enterOutreachAdmin, outreachMetadata } from "../../../adminGate";
import ConfirmDelete from "../../../ui/ConfirmDelete";
import OutreachBreadcrumbs from "../../../ui/OutreachBreadcrumbs";
import { deleteOutreachChannel } from "../../actions";
import ChannelForm from "../../ui/ChannelForm";

export const generateMetadata = outreachMetadata;

export default async function EditarGrupoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await enterOutreachAdmin(locale);
  const t = await getTranslations("outreach");

  const channel = await createOutreachChannelRepository().findById(id);

  if (!channel) notFound();

  const heading = t("editGroupHeading", { name: channel.name });

  return (
    <main>
      <OutreachBreadcrumbs inGroups steps={[{ label: channel.name }]} />
      <h1 className="text-xl font-bold mb-4">{heading}</h1>
      <ChannelForm label={heading} id={channel.id} initial={channel} />
      <ConfirmDelete
        action={deleteOutreachChannel}
        id={channel.id}
        triggerLabel={t("deleteGroup")}
        question={t("deleteGroupQuestion", { name: channel.name })}
      />
    </main>
  );
}
