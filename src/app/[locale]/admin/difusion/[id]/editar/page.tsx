import { getTranslations } from "next-intl/server";
import { routing } from "~/i18n/routing";
import { createOutreachProductCatalog } from "~/infra/dataAccess/outreach/factory";
import { enterOutreachAdmin, outreachMetadata } from "../../adminGate";
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

  const [{ text }, products] = await Promise.all([
    loadOutreachText(id, locale),
    createOutreachProductCatalog().listProducts({
      locale,
      fallbackLocale: routing.defaultLocale,
    }),
  ]);
  const heading = t("editHeading", { name: text.name });

  return (
    <main>
      <h1 className="text-xl font-bold mb-4">{heading}</h1>
      <OutreachTextForm
        label={heading}
        id={text.id}
        products={products}
        initial={{
          name: text.name,
          opening: text.opening,
          closing: text.closing,
          items: text.products.map((product) => ({
            postId: product.postId,
            title: product.title,
            label: product.label,
            emoji: product.emoji ?? "",
          })),
        }}
      />
    </main>
  );
}
