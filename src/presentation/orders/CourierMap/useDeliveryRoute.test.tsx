import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Route } from "~/domain/routing/route";
import { ROUTE_REFRESH_MS, useDeliveryRoute } from "./useDeliveryRoute";

const ROUTE: Route = {
  distanceMeters: 2600,
  durationSeconds: 540,
  path: [
    { lat: 25.6699, lng: -100.3097 },
    { lat: 25.6766, lng: -100.3303 },
  ],
};

const routeToDestination = vi.fn(async (_orderId: string) => ROUTE);

vi.mock("~/presentation/orders/orderActions", () => ({
  routeToDestination: (orderId: string) => routeToDestination(orderId),
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  routeToDestination.mockClear();
});

describe("useDeliveryRoute", () => {
  it("pide el camino al abrir y lo devuelve", async () => {
    const { result } = renderHook(() => useDeliveryRoute("order-1", true));

    await act(async () => {});

    expect(routeToDestination).toHaveBeenCalledWith("order-1");
    expect(result.current).toEqual(ROUTE);
  });

  /* @slice-16 @component: la ficha se refresca cada 15 s, pero el camino se pide como mucho una
     vez por minuto — cuota y términos de Mapbox. */
  it("abierta 3 minutos, con refrescos cada 15 s, pide como mucho 3 caminos", async () => {
    const { rerender } = renderHook(
      ({ enabled }) => useDeliveryRoute("order-1", enabled),
      { initialProps: { enabled: true } },
    );

    /* Once refrescos de 15 s: 2 min 45 s. Las consultas caen en 0, 1 y 2 minutos. */
    for (let elapsed = 15_000; elapsed < 3 * 60_000; elapsed += 15_000) {
      await act(async () => {
        vi.advanceTimersByTime(15_000);
      });
      rerender({ enabled: true });
    }

    expect(routeToDestination.mock.calls.length).toBeLessThanOrEqual(3);
    expect(ROUTE_REFRESH_MS).toBe(60_000);
  });

  it("volverse vieja y fresca dentro del mismo minuto no gasta otra consulta", async () => {
    const { rerender } = renderHook(
      ({ enabled }) => useDeliveryRoute("order-1", enabled),
      { initialProps: { enabled: true } },
    );
    await act(async () => {});

    rerender({ enabled: false });
    await act(async () => {
      vi.advanceTimersByTime(20_000);
    });
    rerender({ enabled: true });
    await act(async () => {});

    expect(routeToDestination).toHaveBeenCalledTimes(1);
  });

  it("deshabilitado, no pide nada y no enseña camino", async () => {
    const { result } = renderHook(() => useDeliveryRoute("order-1", false));

    await act(async () => {});

    expect(routeToDestination).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});
