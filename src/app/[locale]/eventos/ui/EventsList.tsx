import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
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
      <p data-testid="events-empty" className="pt-4">
        {t("empty")}
      </p>
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
