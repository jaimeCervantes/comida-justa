import { describe, expect, it, vi } from "vitest";

/* Igual que en `CardForList.test.tsx`: la acción de disponibilidad arrastra `next-auth`, que no
   resuelve en Vitest. Aquí se prueba lo que pinta la sección, no lo que hace el servidor. */
vi.mock("~/presentation/post/availabilityAction", () => ({
  setAvailability: vi.fn(),
}));

import { screen, within } from "@testing-library/react";
import type { StoreSummary } from "~/domain/entities/seller/directory";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import PillarLocalSection, { type PillarLocalCopy } from "./PillarLocalSection";

const COPY: PillarLocalCopy = {
  heading: "Cerca de ti",
  intro: "Lo que se cocina y se cultiva cerca.",
  emptyBody: "Todavía no hay nada de alimentación publicado cerca de ti.",
  publishLabel: "Publica tu negocio o tu producto",
  seeAllLabel: "Ver todo en Alimentación",
  storesHeading: "Quién lo tiene cerca",
  publicationsLabel: (count) => `${count} publicaciones`,
  visitLabel: "Ver la tienda",
};

/** La tienda real de la comunidad, con su sucursal en el ancla. */
const HAZLO_SANO: StoreSummary = {
  handle: "hazlo-sano",
  name: "Hazlo Sano",
  description: "Comida real preparada en Tezonapa.",
  logoUrl: null,
  publicationCount: 13,
  distanceMeters: 0,
};

/** «Jugo Verde» a 40, tal como está publicado hoy. */
const JUGO_VERDE = {
  id: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  price: 40,
  createdAt: new Date("2026-07-01").toISOString(),
  user: { id: "user-1", name: "Hazlo Sano" },
  to: "/jugo-verde",
  media: [{ url: "https://ruta/de/imagen/1.webp", type: "image", alt: "Jugo" }],
};

function renderSection(
  overrides: Partial<Parameters<typeof PillarLocalSection>[0]> = {},
) {
  return render(
    <PillarLocalSection
      pillar="nutrition"
      categoryKey="alimentacion"
      copy={COPY}
      posts={[JUGO_VERDE]}
      stores={[HAZLO_SANO]}
      {...overrides}
    />,
  );
}

describe("cuando el pilar tiene gente cerca", () => {
  it("muestra a quién se le compra y qué vende", () => {
    renderSection();

    expect(screen.getByTestId("pillar-local-stores")).toHaveTextContent(
      "Hazlo Sano",
    );
    expect(screen.getByTestId("pillar-local-posts")).toHaveTextContent(
      "Jugo Verde",
    );
  });

  /* La sección es un aperitivo, no el catálogo: sin la salida, lo que no cabe en cuatro tarjetas
     deja de existir para quien llegó por el pilar. */
  it("ofrece salir al catálogo completo de su categoría", () => {
    renderSection();

    expect(
      screen.getByRole("link", { name: "Ver todo en Alimentación" }),
    ).toHaveAttribute("href", "/categoria/alimentacion");
  });

  it("no invita a publicar cuando ya hay contenido", () => {
    renderSection();

    expect(screen.queryByTestId("pillar-local-empty")).toBeNull();
  });

  /* Una tienda sin catálogo publicado y un producto sin tienda son los dos casos reales de la base;
     ninguno debe vaciar la sección entera. */
  it("se sostiene con solo tiendas o con solo publicaciones", () => {
    const { unmount } = renderSection({ posts: [] });
    expect(screen.getByTestId("pillar-local-stores")).toBeInTheDocument();
    expect(screen.queryByTestId("pillar-local-empty")).toBeNull();
    unmount();

    renderSection({ stores: [] });
    expect(screen.getByTestId("pillar-local-posts")).toBeInTheDocument();
    expect(screen.queryByTestId("pillar-local-empty")).toBeNull();
  });
});

/**
 * Hoy es el estado de tres de los cuatro pilares, así que no es un caso de borde: es la mitad del
 * trabajo. Lo que no puede pasar es que la sección desaparezca o finja una lista.
 */
describe("cuando todavía no hay nadie", () => {
  it("lo dice y invita a ser el primero, sin pintar tarjetas", () => {
    renderSection({ posts: [], stores: [] });

    expect(screen.getByTestId("pillar-local-empty")).toHaveTextContent(
      "Todavía no hay nada de alimentación publicado cerca de ti.",
    );
    expect(
      screen.getByRole("link", { name: "Publica tu negocio o tu producto" }),
    ).toHaveAttribute("href", "/publicar");
    expect(screen.queryByTestId("pillar-local-stores")).toBeNull();
    expect(screen.queryByTestId("pillar-local-posts")).toBeNull();
  });

  it("sigue siendo la sección del pilar, no un hueco", () => {
    renderSection({ posts: [], stores: [] });

    expect(
      screen.getByRole("heading", { name: "Cerca de ti" }),
    ).toBeInTheDocument();
  });
});

/**
 * El color no es decorativo: es lo que dice de qué pilar es la sección antes de leer nada. Se
 * resuelve desde la clave del pilar, así que una página no puede pedir el color de otro.
 */
describe.each([
  ["sleep", "pillar-sleep"],
  ["nutrition", "pillar-nutrition"],
  ["movement", "pillar-movement"],
  ["mindSpirit", "pillar-mind-spirit"],
] as const)("la sección de %s", (pillar, token) => {
  it(`se pinta con ${token}`, () => {
    renderSection({ pillar, posts: [], stores: [] });

    const empty = screen.getByTestId("pillar-local-empty");
    const panel = empty.closest("div[class]");

    expect(panel?.className).toContain(token);
  });

  it("se anuncia como la sección de su pilar", () => {
    renderSection({ pillar, posts: [], stores: [] });

    expect(screen.getByTestId("pillar-local")).toHaveAttribute(
      "data-pillar",
      pillar,
    );
  });
});

describe("la lista de tiendas", () => {
  it("enlaza a cada tienda y dice cuánto publica", () => {
    renderSection();
    const stores = screen.getByTestId("pillar-local-stores");

    expect(within(stores).getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/tienda/hazlo-sano",
    );
    expect(stores).toHaveTextContent("13 publicaciones");
  });
});
