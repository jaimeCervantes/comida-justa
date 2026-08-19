import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import EditPostForm from "./EditPostForm";

const noop = vi.fn();

const EVENT_POST = {
  slug: "rodada-cafetera",
  title: "Rodada cafetera",
  content: "Salida comunitaria",
  price: null,
  kind: "evento",
  origin: null,
  category: null,
  subCategory: null,
  startsAt: "2027-08-23T13:30:00.000Z",
  endsAt: "2027-08-23T15:00:00.000Z",
  durationMinutes: null,
  media: [
    {
      url: "https://example.com/rodada.jpg",
      type: "image",
      alt: "Rodada cafetera",
      width: 1200,
      height: 800,
    },
  ],
};

describe("EditPostForm — fechas de evento", () => {
  it("muestra el instante guardado como hora local de la comunidad", () => {
    renderWithIntl(
      <EditPostForm
        action={noop}
        post={EVENT_POST}
        categoryOptions={[]}
        subCategoryOptionsByCategory={{}}
      />,
    );

    expect(screen.getByLabelText(/cuándo empieza/i)).toHaveValue(
      "2027-08-23T07:30",
    );
    expect(screen.getByLabelText(/cuándo termina/i)).toHaveValue(
      "2027-08-23T09:00",
    );
  });
});
