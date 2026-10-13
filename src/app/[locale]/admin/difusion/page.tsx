import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { createOutreachTextRepository } from "~/infra/dataAccess/outreach/factory";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import ListOutreachTextsUseCase from "~/use_cases/outreach/listOutreachTextsUseCase";
import { enterOutreachAdmin, outreachMetadata } from "./adminGate";

export const generateMetadata = outreachMetadata;

export default async function DifusionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  const texts = await new ListOutreachTextsUseCase(
    createOutreachTextRepository(),
  ).execute();

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("listHeading")}</h1>

      <p className="mb-6 text-text-support">
        {t.rich("listIntro", { b: (chunks) => <strong>{chunks}</strong> })}
      </p>

      <Link
        href="/admin/difusion/nueva"
        className={`${buttonVariants({ color: "green" })} mb-6`}
      >
        {t("newText")}
      </Link>

      {texts.length === 0 ? (
        <p className="text-text-support">{t("emptyList")}</p>
      ) : (
        <ul data-testid="outreach-texts" className="flex flex-col gap-2">
          {texts.map((text) => (
            <li key={text.id}>
              <Link
                href={{
                  pathname: "/admin/difusion/[id]",
                  params: { id: text.id },
                }}
                className="font-semibold hover:text-highlight"
              >
                {text.name}
              </Link>{" "}
              <span className="text-sm text-text-support">
                {t("productCount", { count: text.productCount })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
