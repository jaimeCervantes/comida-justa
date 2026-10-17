import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { createOutreachTextRepository } from "~/infra/dataAccess/outreach/factory";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import ListOutreachTextsUseCase from "~/use_cases/outreach/listOutreachTextsUseCase";
import { enterOutreachAdmin, outreachMetadata } from "./adminGate";
import OutreachBreadcrumbs from "./ui/OutreachBreadcrumbs";
import {
  OutreachListPagination,
  OutreachNothingFound,
} from "./ui/OutreachListPages";
import OutreachListSearch from "./ui/OutreachListSearch";
import { readOutreachListParams } from "./ui/outreachListHref";

export const generateMetadata = outreachMetadata;

export default async function DifusionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");
  const query = readOutreachListParams(await searchParams);

  const {
    items: texts,
    total,
    page,
  } = await new ListOutreachTextsUseCase(
    createOutreachTextRepository(),
  ).execute(query);

  return (
    <main>
      <OutreachBreadcrumbs />
      <Heading level={1} className="mb-2">
        {t("listHeading")}
      </Heading>

      <p className="mb-6 text-text-support">
        {t.rich("listIntro", { b: (chunks) => <strong>{chunks}</strong> })}
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/admin/difusion/nueva"
          className={buttonVariants({ color: "green" })}
        >
          {t("newText")}
        </Link>
        <Link
          href="/admin/difusion/grupos"
          className="font-semibold hover:text-highlight"
        >
          {t("groupsLink")}
        </Link>
        <Link
          href="/admin/difusion/pies"
          className="font-semibold hover:text-highlight"
        >
          {t("footersLink")}
        </Link>
      </div>

      {total > 0 || query.term ? (
        <OutreachListSearch
          pathname="/admin/difusion"
          term={query.term}
          label={t("textsSearchLabel")}
          placeholder={t("textsSearchPlaceholder")}
          testId="outreach-texts-search"
        />
      ) : null}

      {texts.length === 0 ? (
        query.term ? (
          <OutreachNothingFound
            pathname="/admin/difusion"
            message={t("textsNothingFound", { term: query.term })}
            clearLabel={t("clearSearch")}
            testId="outreach-texts-nothing-found"
          />
        ) : (
          <p className="text-text-support">{t("emptyList")}</p>
        )
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

      <OutreachListPagination
        pathname="/admin/difusion"
        term={query.term}
        page={page}
        total={total}
        testId="outreach-texts-pagination"
      />
    </main>
  );
}
