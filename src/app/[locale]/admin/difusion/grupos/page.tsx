import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { createOutreachChannelRepository } from "~/infra/dataAccess/outreach/factory";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import ListOutreachChannelsUseCase from "~/use_cases/outreach/listOutreachChannelsUseCase";
import { enterOutreachAdmin } from "../adminGate";
import OutreachBreadcrumbs from "../ui/OutreachBreadcrumbs";
import { channelSummary } from "./channelSummary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("outreach");

  return {
    title: t("groupsMetaTitle", { brand: PUBLIC_BRAND_NAME }),
    description: t("groupsIntro"),
    robots: { index: false, follow: false },
  };
}

export default async function GruposDifusionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await enterOutreachAdmin((await params).locale);
  const t = await getTranslations("outreach");

  const channels = await new ListOutreachChannelsUseCase(
    createOutreachChannelRepository(),
  ).execute();

  return (
    <main>
      <OutreachBreadcrumbs inGroups />

      <Heading level={1} className="mb-2">
        {t("groupsHeading")}
      </Heading>
      <p className="mb-6 text-text-support">{t("groupsIntro")}</p>

      <Link
        href="/admin/difusion/grupos/nuevo"
        className={`${buttonVariants({ color: "green" })} mb-6`}
      >
        {t("newGroup")}
      </Link>

      {channels.length === 0 ? (
        <p className="text-text-support">{t("emptyGroups")}</p>
      ) : (
        <ul data-testid="outreach-groups" className="flex flex-col gap-3">
          {channels.map((channel) => (
            <li
              key={channel.id}
              data-testid="outreach-group"
              className="rounded-card border border-separator p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-highlight"
                >
                  {channel.name}
                </a>
                <Link
                  href={{
                    pathname: "/admin/difusion/grupos/[id]/editar",
                    params: { id: channel.id },
                  }}
                  className="text-sm font-semibold hover:text-highlight"
                >
                  {t("editGroup")}
                </Link>
              </div>
              <p
                data-testid="outreach-group-summary"
                className="text-sm text-text-support"
              >
                {channelSummary(t, channel)}
              </p>
              {channel.notes ? (
                <p className="mt-1 whitespace-pre-line text-sm">
                  {channel.notes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
