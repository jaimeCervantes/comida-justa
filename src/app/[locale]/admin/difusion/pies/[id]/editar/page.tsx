import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createOutreachFooterRepository } from "~/infra/dataAccess/outreach/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { enterOutreachAdmin, outreachMetadata } from "../../../adminGate";
import ConfirmDelete from "../../../ui/ConfirmDelete";
import OutreachBreadcrumbs from "../../../ui/OutreachBreadcrumbs";
import { deleteOutreachFooter } from "../../actions";
import FooterForm from "../../ui/FooterForm";

export const generateMetadata = outreachMetadata;

export default async function EditarPiePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await enterOutreachAdmin(locale);
  const t = await getTranslations("outreach");

  const footer = await createOutreachFooterRepository().findById(id);

  if (!footer) notFound();

  const heading = t("editFooterHeading", { name: footer.name });

  return (
    <main>
      <OutreachBreadcrumbs inFooters steps={[{ label: footer.name }]} />
      <Heading level={1} className="mb-4">
        {heading}
      </Heading>
      <FooterForm label={heading} id={footer.id} initial={footer} />
      <ConfirmDelete
        action={deleteOutreachFooter}
        id={footer.id}
        triggerLabel={t("deleteFooter")}
        question={t("deleteFooterQuestion", { name: footer.name })}
      />
    </main>
  );
}
