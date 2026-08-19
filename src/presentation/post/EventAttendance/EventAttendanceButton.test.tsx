import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./eventAttendanceAction", () => ({ toggleEventAttendance: vi.fn() }));

import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import EventAttendanceButton from "./EventAttendanceButton";

function render({
  isOffered = true,
  attending = false,
  attendees = 0,
  canAttend = true,
} = {}) {
  return renderWithIntl(
    <EventAttendanceButton
      postId="evento-1"
      isOffered={isOffered}
      attending={attending}
      attendees={attendees}
      canAttend={canAttend}
      signInHref="/auth/signin?callbackUrl=%2Fmeditacion"
      path="/meditacion"
    />,
  );
}

describe("EventAttendanceButton", () => {
  it("pinta la intención de asistir y el contador público", () => {
    render();

    expect(screen.getByTestId("event-attendance-toggle")).toHaveTextContent(
      es.post.eventAttendConfirm,
    );
    expect(screen.getByTestId("event-attendance-count")).toHaveTextContent(
      "Nadie ha confirmado asistencia",
    );
  });

  it("pinta cancelar cuando la persona ya confirmó", () => {
    render({ attending: true, attendees: 1 });

    expect(screen.getByTestId("event-attendance-toggle")).toHaveTextContent(
      es.post.eventAttendCancel,
    );
    expect(screen.getByTestId("event-attendance-count")).toHaveTextContent(
      "1 persona va a asistir",
    );
  });

  it("sin sesión lleva a entrar, pero conserva visible el contador", () => {
    render({ canAttend: false, attendees: 3 });

    const link = screen.getByTestId("event-attendance-confirm-signin");

    expect(link).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fmeditacion",
    );
    expect(link).toHaveTextContent(es.post.eventAttendConfirm);
    expect(screen.queryByTestId("event-attendance-toggle")).toBeNull();
    expect(screen.getByTestId("event-attendance-count")).toHaveTextContent(
      "3 personas van a asistir",
    );
  });

  it("manda solo la intención, no el estado actual", () => {
    const { container } = render({ attending: true });

    const fields = [...container.querySelectorAll("input[type=hidden]")].map(
      (node) => node.getAttribute("name"),
    );

    expect(fields).toEqual(["postId", "path"]);
    expect(fields).not.toContain("attending");
  });

  it("no aparece fuera de eventos con horario", () => {
    render({ isOffered: false });

    expect(screen.queryByTestId("event-attendance-toggle")).toBeNull();
    expect(screen.queryByTestId("event-attendance-count")).toBeNull();
  });
});
