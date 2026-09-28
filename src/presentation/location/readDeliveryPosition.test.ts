import { afterEach, describe, expect, it, vi } from "vitest";
import { readDeliveryPosition } from "./readDeliveryPosition";

/* Colonia Obispado, Monterrey. */
const DESTINO = { latitude: 25.6766, longitude: -100.3303 };

function browserWith(
  permission: PermissionState,
  answer: "position" | "error" | "silence",
) {
  const getCurrentPosition = vi.fn(
    (ok: PositionCallback, fail: PositionErrorCallback) => {
      if (answer === "position") {
        ok({ coords: DESTINO } as GeolocationPosition);
      } else if (answer === "error") {
        fail({ code: 1 } as GeolocationPositionError);
      }
    },
  );

  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition },
    permissions: { query: vi.fn().mockResolvedValue({ state: permission }) },
  });

  return getCurrentPosition;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("readDeliveryPosition", () => {
  it("con permiso concedido devuelve la posición", async () => {
    browserWith("granted", "position");

    expect(await readDeliveryPosition()).toEqual({
      lat: DESTINO.latitude,
      lng: DESTINO.longitude,
    });
  });

  /* Es el cambio de 2026-09-28: sin permiso todavía, se pregunta en el mismo clic. */
  it("sin permiso todavía, lo pide y usa la posición si se concede", async () => {
    const getCurrentPosition = browserWith("prompt", "position");

    expect(await readDeliveryPosition()).toEqual({
      lat: DESTINO.latitude,
      lng: DESTINO.longitude,
    });
    expect(getCurrentPosition).toHaveBeenCalled();
  });

  it("si se niega el diálogo, sigue sin destino", async () => {
    browserWith("prompt", "error");

    expect(await readDeliveryPosition()).toBeNull();
  });

  it("si ya se había negado, no vuelve a insistir", async () => {
    const getCurrentPosition = browserWith("denied", "position");

    expect(await readDeliveryPosition()).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  /* Un diálogo que nadie contesta no puede dejar la compra colgada. */
  it("si el diálogo se queda sin contestar, se rinde y el pedido sigue", async () => {
    vi.useFakeTimers();
    browserWith("prompt", "silence");

    const pending = readDeliveryPosition();
    await vi.advanceTimersByTimeAsync(20_000);

    expect(await pending).toBeNull();
  });
});
