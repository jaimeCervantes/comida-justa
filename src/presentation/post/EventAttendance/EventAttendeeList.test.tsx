import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import EventAttendeeList from "./EventAttendeeList";

describe("EventAttendeeList", () => {
  it("no se pinta cuando la lista no está autorizada", () => {
    renderWithIntl(<EventAttendeeList attendees={null} />);

    expect(screen.queryByTestId("event-attendees")).toBeNull();
  });

  it("muestra el vacío al creador cuando nadie ha confirmado", () => {
    renderWithIntl(<EventAttendeeList attendees={[]} />);

    expect(screen.getByTestId("event-attendees")).toHaveTextContent(
      "Asistentes",
    );
    expect(screen.getByTestId("event-attendees")).toHaveTextContent(
      "Todavía nadie ha confirmado asistencia.",
    );
  });

  it("muestra nombre y correo de quienes confirmaron", () => {
    renderWithIntl(
      <EventAttendeeList
        attendees={[
          {
            id: "ana",
            name: "Ana López",
            email: "ana@example.com",
            image: null,
            confirmedAt: new Date("2026-08-18T18:00:00Z"),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("event-attendee")).toHaveTextContent("Ana López");
    expect(screen.getByTestId("event-attendee")).toHaveTextContent(
      "ana@example.com",
    );
  });
});
