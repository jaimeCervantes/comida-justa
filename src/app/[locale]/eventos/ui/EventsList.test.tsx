import { describe, expect, it, vi } from "vitest";

vi.mock("~/presentation/post/availabilityAction", () => ({
  setAvailability: vi.fn(),
}));

import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import EventsList from "./EventsList";

const event = {
  id: "event-1",
  title: "Meditacion guiada en el parque",
  price: null,
  origin: null,
  kind: "evento",
  startsAt: new Date("2027-08-23T07:30:00Z"),
  createdAt: new Date("2026-08-18").toISOString(),
  user: { id: "user-1", name: "Hazlo Sano" },
  to: "/meditacion-guiada-en-el-parque",
  media: [
    {
      url: "https://ruta/de/imagen/1.webp",
      type: "image",
      alt: "Meditacion guiada en el parque",
    },
  ],
};

describe("When the events list is rendered", () => {
  it("shows the empty state instead of the grid when there are no events", () => {
    const { getByTestId, queryByTestId } = render(
      <EventsList events={[]} currentPage={1} totalPages={0} />,
    );

    expect(getByTestId("events-empty")).toHaveTextContent(
      "Aún no hay eventos publicados.",
    );
    expect(queryByTestId("events-grid")).not.toBeInTheDocument();
  });

  it("renders each event card with its event date", () => {
    const { getByTestId, getByText } = render(
      <EventsList events={[event]} currentPage={1} totalPages={1} />,
    );

    expect(getByText(event.title)).toBeInTheDocument();
    expect(getByTestId("event-date")).toBeInTheDocument();
  });

  it("links to the next events page when there is more than one", () => {
    const { getByRole } = render(
      <EventsList events={[event]} currentPage={1} totalPages={3} />,
    );

    expect(getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/eventos/page/2",
    );
  });
});
