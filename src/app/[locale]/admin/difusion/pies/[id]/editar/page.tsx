import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createOutreachFooterRepository } from "~/infra/dataAccess/outreach/factory";
import { enterOutreachAdmin, outreachMetadata } from "../../../adminGate";
import OutreachBreadcrumbs from "../../../ui/OutreachBreadcrumbs";
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
      <h1 className="text-xl font-bold mb-4">{heading}</h1>
      <FooterForm label={heading} id={footer.id} initial={footer} />
    </main>
  );
}
