import { describe, expect, it } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
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

  it("shows the Local badge for a resale the seller got nearby", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="reventa_cercana" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent("Local");
  });

  /* Una tarjeta de listado no consulta distancias, así que un productor afirma lo que sí sabe. */
  it("says who made it, not where it is, for a producer", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} origin="productor" />,
    );

    expect(getByTestId("provenance-badge")).toHaveTextContent(
      "Lo hace quien lo vende",
    );
  });

  it("shows no badge when the post has no origin", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} origin={null} />,
    );

    expect(queryByTestId("provenance-badge")).not.toBeInTheDocument();
  });
});
