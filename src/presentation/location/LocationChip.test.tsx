import { screen, waitFor } from "@testing-library/react";
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

  /*
   * Desde el slice 5 de `chrome.feature` no está escrito en pantalla —la barra tenía que caber en
   * un renglón— sino en el nombre accesible del bloque. Se sigue diciendo entero; lo que cambió es
   * quién lo oye sin mirar.
   */
  it("dice que las distancias salen de tu ubicación", () => {
    renderWithIntl(<LocationChip fix={fixFrom(2)} />);

    expect(screen.getByTestId("location-chip")).toHaveAccessibleName(
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

    expect(screen.getByTestId("location-chip")).toHaveAccessibleName(esperado);
  });

  it("calla la antigüedad cuando no la sabe, en vez de inventarla", () => {
    renderWithIntl(<LocationChip fix={fixFrom(null)} />);

    expect(screen.getByTestId("location-chip")).not.toHaveAccessibleName(
      /actualizada/i,
    );
    // Pero el control para corregirla sigue ahí, que es lo que no había antes.
    expect(screen.getByTestId("refresh-location")).toBeInTheDocument();
  });

  /*
   * Lo que el slice 5 vino a comprar: la barra es chrome de todas las rutas, así que cada palabra
   * dibujada se paga en todas. Aquí lo dibujado es el botón; el resto se anuncia.
   */
  it("no dibuja la explicación: lo escrito es lo que se pulsa", () => {
    renderWithIntl(<LocationChip fix={fixFrom(2)} />);

    const chip = screen.getByTestId("location-chip");

    expect(chip).not.toHaveTextContent(/distancias desde tu ubicación/i);
    expect(chip).not.toHaveTextContent(/hace 2 horas/i);
    expect(chip).toHaveTextContent(/actualizar/i);
  });

  it("ofrece siempre corregirla: esa era la salida que no existía", async () => {
    stubGeolocation();

    renderWithIntl(<LocationChip fix={fixFrom(137 * 24)} />);
    await userEvent.click(screen.getByTestId("refresh-location"));

    expect(shareLocation).toHaveBeenCalledTimes(1);
  });

  /*
   * El chip es el único de los tres que sobrevive a su propia corrección: el aviso se vuelve chip y
   * el botón suelto se vuelve distancia, pero este sigue en pantalla. Por eso aquí se veía que el
   * estado "locating" no tenía vuelta, y el botón se quedaba cargando para siempre sobre una
   * antigüedad que ya decía "hace unos segundos".
   */
  it("deja de cargar cuando la ubicación ya se guardó", async () => {
    stubGeolocation();

    renderWithIntl(<LocationChip fix={fixFrom(137 * 24)} />);
    await userEvent.click(screen.getByTestId("refresh-location"));

    await waitFor(() =>
      expect(screen.getByTestId("refresh-location")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );
    expect(screen.getByTestId("refresh-location")).toBeEnabled();
  });

  it("tampoco se queda cargando si la acción revienta", async () => {
    stubGeolocation();
    shareLocation.mockRejectedValueOnce(new Error("se cayó el servidor"));

    renderWithIntl(<LocationChip fix={fixFrom(137 * 24)} />);
    await userEvent.click(screen.getByTestId("refresh-location"));

    await waitFor(() =>
      expect(screen.getByTestId("refresh-location")).toBeEnabled(),
    );
  });
});

function stubGeolocation(): void {
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
}
