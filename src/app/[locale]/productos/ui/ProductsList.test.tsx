import { describe, expect, it, vi } from "vitest";

/*
 * La acción de disponibilidad es un Server Action y arrastra `next-auth`, que no resuelve en el
 * entorno de Vitest. Aquí se prueba lo que pinta la tarjeta, no lo que hace el servidor cuando se
 * aprieta el botón —eso vive en el e2e—, así que se corta la cadena en el borde.
 */
vi.mock("~/presentation/post/availabilityAction", () => ({
  setAvailability: vi.fn(),
}));

import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import ProductsList from "./ProductsList";

const product = {
  id: "product-1",
  title: "Miel de abeja de Hazlo Sano",
  price: 150,
  origin: "hazlo_sano_propio",
  kind: "producto",
  createdAt: new Date("2026-07-01").toISOString(),
  user: { id: "user-1", name: "Hazlo Sano" },
  to: "/miel-de-abeja-de-hazlo-sano",
  media: [{ url: "https://ruta/de/imagen/1.webp", type: "image", alt: "Miel" }],
};

const service = {
  ...product,
  id: "service-1",
  title: "Masaje relajante 30 minutos",
  price: 300,
  origin: null,
  kind: "servicio",
  to: "/masaje-relajante-30-minutos",
  slug: "masaje-relajante-30-minutos",
  durationMinutes: 30,
};

describe("When the products and services list is rendered", () => {
  it("shows the empty state instead of the grid when there are no commercial posts", () => {
    const { getByTestId, queryByTestId } = render(
      <ProductsList
        products={[]}
        currentPage={1}
        totalPages={0}
        currentPillar={null}
      />,
    );

    expect(getByTestId("products-empty")).toHaveTextContent(
      "Aún no hay productos ni servicios publicados.",
    );
    expect(queryByTestId("products-grid")).not.toBeInTheDocument();
  });

  it("renders products and services with the action each one needs", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <ProductsList
        products={[product, service]}
        currentPage={1}
        totalPages={1}
        currentPillar={null}
      />,
    );

    expect(getByText(product.title)).toBeInTheDocument();
    expect(getByText(service.title)).toBeInTheDocument();
    expect(getByTestId("provenance-badge")).toHaveTextContent("Hazlo Sano");
    expect(getByTestId("card-book-service")).toHaveTextContent("Agendar");
    expect(queryByTestId("add-to-cart")).toBeInTheDocument();
  });

  it("links to the next products page when there is more than one", () => {
    const { getByRole } = render(
      <ProductsList
        products={[product]}
        currentPage={1}
        totalPages={3}
        currentPillar="movement"
      />,
    );

    expect(getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/productos/page/2?pillar=movement",
    );
  });

  it("nombra el pilar cuando el filtro deja vacia la lista", () => {
    const { getByTestId } = render(
      <ProductsList
        products={[]}
        currentPage={1}
        totalPages={0}
        currentPillar="movement"
      />,
    );

    expect(getByTestId("products-empty")).toHaveTextContent(
      "Todavía no hay publicaciones de Movimiento aquí.",
    );
  });
});
