import { getTranslations } from "next-intl/server";
import { routing } from "~/i18n/routing";
import {
  createOutreachFooterRepository,
  createOutreachProductCatalog,
} from "~/infra/dataAccess/outreach/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { deleteOutreachText } from "../../actions";
import { enterOutreachAdmin, outreachMetadata } from "../../adminGate";
import ConfirmDelete from "../../ui/ConfirmDelete";
import OutreachBreadcrumbs from "../../ui/OutreachBreadcrumbs";
import OutreachTextForm from "../../ui/OutreachTextForm";
import { loadOutreachText } from "../loadOutreachText";

export const generateMetadata = outreachMetadata;

export default async function EditarDifusionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = await enterOutreachAdmin(rawLocale);
  const t = await getTranslations("outreach");

  const [{ text }, products, footers] = await Promise.all([
    loadOutreachText(id, locale),
    createOutreachProductCatalog().listProducts({
      locale,
      fallbackLocale: routing.defaultLocale,
    }),
    createOutreachFooterRepository().list(),
  ]);
  const heading = t("editHeading", { name: text.name });

  return (
    <main>
      <OutreachBreadcrumbs
        steps={[
          {
            label: text.name,
            href: { pathname: "/admin/difusion/[id]", params: { id: text.id } },
          },
          { label: t("edit") },
        ]}
      />
      <Heading level={1} className="mb-4">
        {heading}
      </Heading>
      <OutreachTextForm
        label={heading}
        id={text.id}
        products={products}
        footers={footers}
        initial={{
          name: text.name,
          opening: text.opening,
          versions: text.versions,
          closing: text.closing,
          footerId: text.footer?.id ?? null,
          items: text.products.map((product) => ({
            postId: product.postId,
            title: product.title,
            label: product.label,
            emoji: product.emoji ?? "",
          })),
        }}
      />
      <ConfirmDelete
        action={deleteOutreachText}
        id={text.id}
        triggerLabel={t("deleteText")}
        question={t("deleteTextQuestion", { name: text.name })}
      />
    </main>
  );
}
