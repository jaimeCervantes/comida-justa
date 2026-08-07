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

  /*
   * El camino real de un vendedor es mirar su catálogo y arreglar lo que ve. Ocultar los controles
   * a los demás es cortesía, no seguridad: quien decide es el servidor.
   */
  it("le ofrece a su dueño editar y marcar agotado sin salir del listado", () => {
    const { getByTestId } = render(
      <CardForList
        {...baseProps}
        kind="producto"
        isAvailable={true}
        viewerId="user-1"
      />,
    );

    expect(getByTestId("card-owner-controls")).toBeInTheDocument();
  });

  /*
   * `to` viene absoluto del mapper, así que recortarle el primer `/` producía
   * `/editar/http://localhost:3000/suero-natural`. El enlace se arma con el `slug` suelto.
   */
  it("enlaza a editar con el slug, no con la URL absoluta", () => {
    const { getByTestId } = render(
      <CardForList
        {...baseProps}
        to="http://localhost:3000/suero-natural"
        slug="suero-natural"
        kind="producto"
        viewerId="user-1"
      />,
    );

    const enlace = getByTestId("card-owner-controls").querySelector("a");

    expect(enlace).toHaveAttribute("href", "/editar/suero-natural");
  });

  it("y si la tarjeta llega sin slug, lo saca del último tramo de la URL", () => {
    const { getByTestId } = render(
      <CardForList
        {...baseProps}
        to="http://localhost:3000/suero-natural"
        kind="producto"
        viewerId="user-1"
      />,
    );

    expect(
      getByTestId("card-owner-controls").querySelector("a"),
    ).toHaveAttribute("href", "/editar/suero-natural");
  });

  it("no se los ofrece a quien solo está mirando", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} kind="producto" viewerId="otra-persona" />,
    );

    expect(queryByTestId("card-owner-controls")).not.toBeInTheDocument();
  });

  it("ni a quien no ha entrado", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} kind="producto" />,
    );

    expect(queryByTestId("card-owner-controls")).not.toBeInTheDocument();
  });

  /* Un anuncio no se agota: a su dueño se le ofrece editarlo y nada más. */
  it("a un anuncio propio solo le ofrece editar", () => {
    const { getByTestId } = render(
      <CardForList {...baseProps} kind="anuncio" viewerId="user-1" />,
    );

    const controls = getByTestId("card-owner-controls");

    expect(controls).toHaveTextContent(/editar/i);
    expect(controls).not.toHaveTextContent(/agotado/i);
  });

  it("shows no badge when the post has no origin", () => {
    const { queryByTestId } = render(
      <CardForList {...baseProps} origin={null} />,
    );

    expect(queryByTestId("provenance-badge")).not.toBeInTheDocument();
  });
});
