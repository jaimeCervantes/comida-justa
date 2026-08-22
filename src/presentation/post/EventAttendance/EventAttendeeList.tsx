import Image from "next/image";
import { useTranslations } from "next-intl";
import type { EventAttendee } from "~/domain/eventAttendance/eventAttendance";
import { Heading } from "~/presentation/design_system/typography/Heading";

function attendeeLabel(attendee: EventAttendee, fallback: string): string {
  return attendee.name || attendee.email || fallback;
}

export default function EventAttendeeList({
  attendees,
}: {
  attendees: EventAttendee[] | null;
}) {
  const t = useTranslations("post");

  if (attendees === null) return null;

  return (
    <section
      className="mt-4 border border-pw-gray/20 rounded-card p-3"
      data-testid="event-attendees"
    >
      <Heading level={2} size="xs">
        {t("eventAttendeesHeading")}
      </Heading>

      {attendees.length === 0 ? (
        <p className="mt-2 text-label text-pw-gray">
          {t("eventAttendeesEmpty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {attendees.map((attendee) => (
            <li
              key={attendee.id}
              className="flex items-center gap-3"
              data-testid="event-attendee"
            >
              {attendee.image ? (
                <Image
                  src={attendee.image}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-pw-green/10 text-sm font-bold text-pw-green"
                >
                  {attendeeLabel(attendee, t("eventAttendeeFallback"))
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {attendeeLabel(attendee, t("eventAttendeeFallback"))}
                </span>
                {attendee.email ? (
                  <span className="block truncate text-label text-pw-gray">
                    {attendee.email}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
