import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { getEvents } from "../../data";
import { buildEventsMetadata } from "../../metadata";
import EventsList from "../../ui/EventsList";

type Props = {
  params: Promise<{ locale: string; page: string }>;
};

function parsePage(value: string): number | null {
  const page = parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? null : page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: pageStr, locale } = await params;
  const page = parsePage(pageStr);

  return page ? buildEventsMetadata(resolveLocale(locale), page) : {};
}

export default async function EventosPaginatedPage({ params }: Props) {
  const { page: pageStr, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("events");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const { events, totalPages } = await getEvents(page, locale);

  if (events.length === 0 && page > 1) {
    notFound();
  }

  return (
    <main>
      <Heading level={1} className="mb-2">
        {t("title")}
      </Heading>
      <p className="mb-2">{t("description")}</p>

      <EventsList
        viewerId={viewerId}
        events={events}
        currentPage={page}
        totalPages={totalPages}
      />

      <div className="mt-4 text-center">
        <Link href="/eventos" className="text-highlight hover:underline">
          {t("backToList")}
        </Link>
      </div>
    </main>
  );
}
