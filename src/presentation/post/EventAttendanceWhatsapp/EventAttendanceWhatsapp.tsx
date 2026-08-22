import type { ReactNode } from "react";
import { MdLogin } from "react-icons/md";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";

type Labels = {
  cta: string;
};

function AttendShell({
  href,
  testId,
  children,
}: {
  href: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      data-testid={testId}
      className="focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control bg-pw-green px-2 py-2 text-label text-white transition-colors hover:bg-pw-green/80"
    >
      <MdLogin size="20" aria-hidden />
      {children}
    </a>
  );
}

export default function EventAttendanceWhatsapp({
  href,
  isOffered,
  canNotify,
  signInHref,
  labels,
}: {
  href: string | null;
  isOffered: boolean;
  canNotify: boolean;
  signInHref: string;
  labels: Labels;
}) {
  if (!isOffered) return null;

  if (!canNotify) {
    return (
      <AttendShell href={signInHref} testId="event-attendance-signin">
        {labels.cta}
      </AttendShell>
    );
  }

  if (!href) return null;

  return (
    <WhatsappButton href={href} testId="event-attendance-whatsapp">
      {labels.cta}
    </WhatsappButton>
  );
}
