import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CardForList from "./CardForList";

const baseProps = {
  id: "post-1",
  title: "Miel de abeja",
  price: 120,
  createdAt: new Date("2026-07-01").toISOString(),
  user: { id: "user-1", name: "Hazlo Sano" },
  to: "/miel-de-abeja",
  media: [{ url: "https://ruta/de/imagen/1.webp", type: "image", alt: "Miel" }],
};

describe("When a card is listed", () => {
  it("shows the Hazlo Sano badge for a hazlo_sano_* origin", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="hazlo_sano_propio" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent("Hazlo Sano");
  });

  it("shows the Local badge for a local origin", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="productor_local" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent("Local");
  });

  it("shows no badge when the post has no origin", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} origin={null} />,
    );

    expect(queryByTestId("provenance-badge")).not.toBeInTheDocument();
  });
});
