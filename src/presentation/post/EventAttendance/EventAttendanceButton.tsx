"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { MdEventAvailable, MdEventBusy } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import {
  type EventAttendanceActionState,
  toggleEventAttendance,
} from "./eventAttendanceAction";

function EventAttendanceCount({ attendees }: { attendees: number }) {
  const t = useTranslations("post");

  return (
    <span
      className="text-label text-pw-gray"
      data-testid="event-attendance-count"
    >
      {t("eventAttendeeCount", { count: attendees })}
    </span>
  );
}

export default function EventAttendanceButton({
  postId,
  isOffered,
  attending,
  attendees,
  canAttend,
  signInHref,
  path,
}: {
  postId: string;
  isOffered: boolean;
  attending: boolean;
  attendees: number;
  /** Si quien mira tiene sesión. Sin ella el CTA visible lleva a entrar. */
  canAttend: boolean;
  signInHref: string;
  path: string;
}) {
  const t = useTranslations("post");
  const [state, action, isPending] = useActionState<
    EventAttendanceActionState,
    FormData
  >(toggleEventAttendance, { attending, attendees });

  if (!isOffered) return null;

  if (!canAttend || state.needsSignIn) {
    return (
      <span className="inline-flex items-center gap-3">
        <a
          href={signInHref}
          data-testid="event-attendance-confirm-signin"
          className="focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control bg-pw-green px-2 py-2 text-label text-white transition-colors hover:bg-pw-green/80"
        >
          <MdEventAvailable size="20" aria-hidden />
          {t("eventAttendConfirm")}
        </a>
        <EventAttendanceCount attendees={state.attendees} />
      </span>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="path" value={path} />
      <Button
        type="submit"
        size="sm"
        color={state.attending ? "default" : "green"}
        isLoading={isPending}
        disabled={isPending}
        data-testid="event-attendance-toggle"
        startIcon={
          state.attending ? (
            <MdEventBusy aria-hidden size="18" />
          ) : (
            <MdEventAvailable aria-hidden size="18" />
          )
        }
      >
        {state.attending ? t("eventAttendCancel") : t("eventAttendConfirm")}
      </Button>
      <EventAttendanceCount attendees={state.attendees} />
    </form>
  );
}
