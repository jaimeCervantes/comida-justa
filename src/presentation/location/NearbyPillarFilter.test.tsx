import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import NearbyPillarFilter from "./NearbyPillarFilter";

const { usePathname, useSearchParams } = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("~/i18n/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/i18n/navigation")>()),
  usePathname,
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams,
}));

function renderAt(pathname: string, search = ""): void {
  usePathname.mockReturnValue(pathname);
  useSearchParams.mockReturnValue(new URLSearchParams(search));
  renderWithIntl(<NearbyPillarFilter />);
}

describe("NearbyPillarFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["/", "/productos"])("pinta el filtro en %s", (pathname) => {
    renderAt(pathname);

    expect(screen.getByTestId("publication-pillar-filter")).toBeVisible();
  });

  /* No es una lista negra: es que el filtro construye enlaces atados a `pathname`, y una ruta
     que no está en la lista no tiene ni feed que filtrar ni forma de saber a dónde enlazar. */
  it.each(["/cuenta", "/carrito", "/nosotros", "/mi-publicacion"])(
    "no pinta nada en %s",
    (pathname) => {
      renderAt(pathname);

      expect(
        screen.queryByTestId("publication-pillar-filter"),
      ).not.toBeInTheDocument();
    },
  );

  it("sin `?pillar=`, «Todo» es la opción activa", () => {
    renderAt("/");

    expect(
      screen.getByRole("link", { name: es.publicationPillars.all }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("con `?pillar=movement`, ese pilar llega marcado como activo", () => {
    renderAt("/productos", "pillar=movement");

    expect(
      screen.getByRole("link", { name: es.publicationPillars.movement }),
    ).toHaveAttribute("aria-current", "page");
  });

  /* Cualquier cosa que no sea uno de los cuatro pilares se trata como si no hubiera filtro, en
     vez de reventar — el mismo criterio que ya usa `parsePublicationPillar`. */
  it("un `?pillar=` inválido no rompe nada: cae en «Todo»", () => {
    renderAt("/", "pillar=no-existe");

    expect(
      screen.getByRole("link", { name: es.publicationPillars.all }),
    ).toHaveAttribute("aria-current", "page");
  });
});
