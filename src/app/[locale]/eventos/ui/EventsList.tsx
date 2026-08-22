import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { EmptyState } from "~/presentation/design_system/feedback/EmptyState";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";

type EventsListProps = {
  events: Post[];
  currentPage: number;
  totalPages: number;
  viewerId?: string | null;
};

export default function EventsList({
  events,
  currentPage,
  totalPages,
  viewerId,
}: EventsListProps) {
  const t = useTranslations("events");

  if (events.length === 0) {
    return (
      <EmptyState
        testId="events-empty"
        className="mt-4"
        title={t("empty")}
        action={
          <Link
            href="/publicar"
            className={buttonVariants({ color: "green", size: "sm" })}
          >
            {t("emptyCta")}
          </Link>
        }
      >
        {t("emptyBody")}
      </EmptyState>
    );
  }

  return (
    <>
      <section data-testid="events-grid" className={`${CARD_MASONRY} pt-6`}>
        {events.map((event: Post) => (
          <CardForList {...event} viewerId={viewerId} key={event.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/eventos/page/[page]"
      />
    </>
  );
}
