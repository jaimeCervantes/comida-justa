import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VisitorFix } from "~/domain/entities/seller/locationFreshness";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import LocationChip from "./LocationChip";

const { shareLocation } = vi.hoisted(() => ({ shareLocation: vi.fn() }));

vi.mock("./actions", () => ({ shareLocation }));

function fixFrom(hoursAgo: number | null): VisitorFix {
  return {
    coordinates: COMMUNITY_ANCHOR,
    fixedAt:
      hoursAgo === null
        ? null
        : new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  };
}

describe("LocationChip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("dice que las distancias salen de tu ubicación", () => {
    renderWithIntl(<LocationChip fix={fixFrom(2)} />);

    expect(screen.getByTestId("location-chip")).toHaveTextContent(
      /distancias desde tu ubicación/i,
    );
  });

  /*
   * La antigüedad es lo único que delata un dato que ya no es cierto: en la base hay una ubicación
   * de hace 137 días midiendo distancias como si fuera de hoy.
   */
  it.each<[string, number, RegExp]>([
    ["minutos", 0.5, /hace 30 minutos/i],
    ["horas", 2, /hace 2 horas/i],
    ["días", 137 * 24, /hace 137 días/i],
  ])("dice desde cuándo es el dato, en %s", (_caso, horas, esperado) => {
    renderWithIntl(<LocationChip fix={fixFrom(horas)} />);

    expect(screen.getByTestId("location-age")).toHaveTextContent(esperado);
  });

  it("calla la antigüedad cuando no la sabe, en vez de inventarla", () => {
    renderWithIntl(<LocationChip fix={fixFrom(null)} />);

    expect(screen.queryByTestId("location-age")).not.toBeInTheDocument();
    // Pero el control para corregirla sigue ahí, que es lo que no había antes.
    expect(screen.getByTestId("refresh-location")).toBeInTheDocument();
  });

  it("ofrece siempre corregirla: esa era la salida que no existía", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: (
          ok: (position: {
            coords: { latitude: number; longitude: number };
          }) => void,
        ) => ok({ coords: { latitude: 19.4326, longitude: -99.1332 } }),
      },
    });

    renderWithIntl(<LocationChip fix={fixFrom(137 * 24)} />);
    await userEvent.click(screen.getByTestId("refresh-location"));

    expect(shareLocation).toHaveBeenCalledTimes(1);
  });
});
