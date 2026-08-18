import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import { getEvents } from "./data";
import { buildEventsMetadata } from "./metadata";
import EventsList from "./ui/EventsList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildEventsMetadata(resolveLocale(locale));
}

export default async function EventosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("events");
  const { events, totalPages } = await getEvents(PAGINATION_INIT_PAGE, locale);

  return (
    <main>
      <h1 className="mb-2 text-xl font-bold">{t("title")}</h1>
      <p className="mb-2">{t("description")}</p>

      <EventsList
        viewerId={viewerId}
        events={events}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={totalPages}
      />
    </main>
  );
}
