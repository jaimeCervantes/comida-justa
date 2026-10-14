import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { createOutreachFooterRepository } from "~/infra/dataAccess/outreach/factory";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import ListOutreachFootersUseCase from "~/use_cases/outreach/listOutreachFootersUseCase";
import { enterOutreachAdmin } from "../adminGate";
import OutreachBreadcrumbs from "../ui/OutreachBreadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("outreach");

  return {
    title: t("footersMetaTitle", { brand: PUBLIC_BRAND_NAME }),
    description: t("footersIntro"),
    robots: { index: false, follow: false },
  };
}

export default async function PiesDifusionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  const footers = await new ListOutreachFootersUseCase(
    createOutreachFooterRepository(),
  ).execute();

  return (
    <main>
      <OutreachBreadcrumbs inFooters />

      <h1 className="text-xl font-bold mb-2">{t("footersHeading")}</h1>
      <p className="mb-6 text-text-support">{t("footersIntro")}</p>

      <Link
        href="/admin/difusion/pies/nuevo"
        className={`${buttonVariants({ color: "green" })} mb-6`}
      >
        {t("newFooter")}
      </Link>

      {footers.length === 0 ? (
        <p className="text-text-support">{t("emptyFooters")}</p>
      ) : (
        <ul data-testid="outreach-footers" className="flex flex-col gap-3">
          {footers.map((footer) => (
            <li
              key={footer.id}
              data-testid="outreach-footer"
              className="rounded-card border border-separator p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{footer.name}</span>
                <Link
                  href={{
                    pathname: "/admin/difusion/pies/[id]/editar",
                    params: { id: footer.id },
                  }}
                  className="text-sm font-semibold hover:text-highlight"
                >
                  {t("edit")}
                </Link>
              </div>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm text-text-support">
                {footer.body}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
