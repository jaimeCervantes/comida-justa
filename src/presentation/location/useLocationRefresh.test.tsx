import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VisitorFix } from "~/domain/entities/seller/locationFreshness";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";

const { refreshLocation } = vi.hoisted(() => ({
  refreshLocation: vi.fn(),
}));

vi.mock("./actions", () => ({ refreshLocation }));

import LocationRefresher from "./LocationRefresher";

type PermissionState = "granted" | "prompt" | "denied";

const getCurrentPosition = vi.fn();

/**
 * Deja el navegador en un estado concreto de permiso y con una posición concreta.
 *
 * `permissions` puede faltar (Safari viejo) o lanzar; los dos casos tienen que terminar en "no
 * preguntes nada", así que se pueden pedir aquí.
 */
function browserAt(
  state: PermissionState | "sin-api" | "lanza",
  meters = 0,
): void {
  getCurrentPosition.mockImplementation(
    (
      ok: (position: {
        coords: { latitude: number; longitude: number };
      }) => void,
    ) =>
      ok({
        coords: {
          latitude:
            COMMUNITY_ANCHOR.latitude +
            meters / ((2 * Math.PI * 6_371_008.8) / 360),
          longitude: COMMUNITY_ANCHOR.longitude,
        },
      }),
  );

  const permissions =
    state === "sin-api"
      ? undefined
      : {
          query:
            state === "lanza"
              ? vi.fn().mockRejectedValue(new Error("no soportado"))
              : vi.fn().mockResolvedValue({ state }),
        };

  vi.stubGlobal("navigator", {
    ...navigator,
    permissions,
    geolocation: { getCurrentPosition },
  });
}

function fixFrom(hoursAgo: number): VisitorFix {
  return {
    coordinates: COMMUNITY_ANCHOR,
    fixedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  };
}

describe("LocationRefresher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("no pinta nada: su trabajo es mirar, no ocupar sitio", () => {
    browserAt("denied");
    const { container } = render(<LocationRefresher fix={fixFrom(1)} />);

    expect(container).toBeEmptyDOMElement();
  });

  /*
   * El corazón de la feature: con el permiso ya concedido, moverse de verdad actualiza la ubicación
   * sin que nadie apriete nada.
   */
  it("con permiso concedido y un movimiento real, guarda la ubicación nueva", async () => {
    browserAt("granted", 2_000);
    render(<LocationRefresher fix={fixFrom(1)} />);

    await waitFor(() => expect(refreshLocation).toHaveBeenCalledTimes(1));
  });

  it("sin nada guardado, cualquier lectura vale la pena", async () => {
    browserAt("granted", 0);
    render(<LocationRefresher fix={null} />);

    await waitFor(() => expect(refreshLocation).toHaveBeenCalledTimes(1));
  });

  /*
   * Sin este filtro, cada carga de página escribiría la cookie y llamaría a `revalidatePath`, que
   * invalida el árbol entero de rutas y obliga a un segundo render completo.
   */
  it("un movimiento pequeño no llega al servidor", async () => {
    browserAt("granted", 120);
    render(<LocationRefresher fix={fixFrom(1)} />);

    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalled());
    expect(refreshLocation).not.toHaveBeenCalled();
  });

  it("aunque no te muevas, una ubicación caducada se refresca", async () => {
    browserAt("granted", 0);
    render(<LocationRefresher fix={fixFrom(7)} />);

    await waitFor(() => expect(refreshLocation).toHaveBeenCalledTimes(1));
  });

  /*
   * Preguntar la posición sin permiso concedido abre el diálogo del navegador sin que nadie lo haya
   * pedido. Es lo que Chrome penaliza y lo que en móvil lleva a bloquear el permiso para siempre.
   */
  it.each<[string, "prompt" | "denied" | "sin-api" | "lanza"]>([
    ["todavía no lo ha concedido", "prompt"],
    ["lo negó", "denied"],
    ["el navegador no tiene la API de permisos", "sin-api"],
    ["la consulta de permiso revienta", "lanza"],
  ])("no le pregunta la posición a nadie que %s", async (_caso, state) => {
    browserAt(state, 2_000);
    render(<LocationRefresher fix={fixFrom(1)} />);

    await waitFor(() => expect(getCurrentPosition).not.toHaveBeenCalled());
    expect(refreshLocation).not.toHaveBeenCalled();
  });

  it("un fallo al leer la posición no rompe la página", async () => {
    browserAt("granted", 2_000);
    getCurrentPosition.mockImplementation(
      (_ok: unknown, fail: (error: { code: number }) => void) =>
        fail({ code: 3 }),
    );
    render(<LocationRefresher fix={fixFrom(1)} />);

    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalled());
    expect(refreshLocation).not.toHaveBeenCalled();
  });
});
