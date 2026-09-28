import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import CourierLocationSharer from "./CourierLocationSharer";

const shareCourierLocation = vi.fn(async () => ({}));

vi.mock("../actions", () => ({
  shareCourierLocation: () => shareCourierLocation(),
}));

/* Macroplaza, Monterrey. */
const POSITION = { coords: { latitude: 25.6699, longitude: -100.3097 } };

function defineOnNavigator(name: string, value: unknown): void {
  Object.defineProperty(navigator, name, { configurable: true, value });
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function wakeLockThat(outcome: "grants" | "denies") {
  const request = vi.fn(async () => {
    if (outcome === "denies") throw new Error("NotAllowedError");

    return { release: vi.fn(async () => {}) };
  });
  defineOnNavigator("wakeLock", { request });

  return request;
}

async function startSharing(): Promise<void> {
  render(<CourierLocationSharer orderId="order-1" token="tok_123" />);
  fireEvent.click(screen.getByTestId("courier-share-button"));
  await screen.findByTestId("courier-share-active");
}

beforeEach(() => {
  defineOnNavigator("geolocation", {
    getCurrentPosition: (ok: PositionCallback) =>
      ok(POSITION as GeolocationPosition),
  });
  setVisibility("visible");
});

afterEach(() => {
  shareCourierLocation.mockClear();
  /* `wakeLock` no existe en jsdom: se borra para que cada caso decida si lo hay. */
  Reflect.deleteProperty(navigator, "wakeLock");
});

describe("CourierLocationSharer", () => {
  it("al compartir, pide dejar la página abierta y a la vista", async () => {
    wakeLockThat("grants");
    await startSharing();

    expect(screen.getByTestId("courier-keep-open")).toHaveTextContent(
      /abierta y a la vista/,
    );
  });

  /* La corrida de escritorio de `orders.feature` (@slice-15 @component). */
  describe("la pantalla no se apaga sola mientras comparto", () => {
    it("lo concede: se pide la pantalla, y no se dice nada más", async () => {
      const request = wakeLockThat("grants");
      await startSharing();

      await waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
      expect(screen.queryByTestId("courier-screen-manual")).toBeNull();
    });

    it("lo niega: se le pide mantener la pantalla encendida él mismo", async () => {
      wakeLockThat("denies");
      await startSharing();

      expect(
        await screen.findByTestId("courier-screen-manual"),
      ).toBeInTheDocument();
    });

    it("no lo soporta: se le pide mantener la pantalla encendida él mismo", async () => {
      await startSharing();

      expect(
        await screen.findByTestId("courier-screen-manual"),
      ).toBeInTheDocument();
    });
  });

  it("al volver a la página, manda la posición en ese momento y vuelve a pedir la pantalla", async () => {
    const request = wakeLockThat("grants");
    await startSharing();
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(shareCourierLocation).toHaveBeenCalledTimes(1);

    act(() => setVisibility("hidden"));
    act(() => setVisibility("visible"));

    await waitFor(() => expect(shareCourierLocation).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });
});
