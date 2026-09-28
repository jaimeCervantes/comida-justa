import type { RouteProvider } from "~/domain/routing/ports";
import type { GeoPoint, Route } from "~/domain/routing/route";

export interface MapboxRouteProviderConfig {
  accessToken: string;
  /** Se cambia solo en e2e, para apuntar a un Mapbox falso local y no gastar cuota. */
  baseUrl?: string;
  /** Inyectable para probar el adapter sin red. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * `driving-traffic`: con tráfico en vivo. No hay perfil de moto; el de auto con tráfico es la
 * aproximación más cercana a un repartidor en ciudad.
 */
const PROFILE = "mapbox/driving-traffic";

interface DirectionsResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: Array<[number, number]> };
  }>;
}

/**
 * Camino por calles con Mapbox Directions.
 *
 * **Nada de lo que devuelve se guarda** —cláusula 2.10.1 de sus términos—, y por eso el `fetch` va
 * con `cache: "no-store"`: sin él, Next podría guardar la respuesta en su caché de datos, que es
 * justo lo prohibido.
 *
 * Cualquier fallo —red, tiempo agotado, clave inválida, sin ruta posible, respuesta rara— se vuelve
 * `null`: la ficha se queda como antes, y no hay nada que el comprador pueda hacer con un error.
 */
export default class MapboxRouteProvider implements RouteProvider {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly config: MapboxRouteProviderConfig) {
    this.baseUrl = config.baseUrl ?? "https://api.mapbox.com";
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 4_000;
  }

  async routeBetween(from: GeoPoint, to: GeoPoint): Promise<Route | null> {
    const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = new URL(
      `/directions/v5/${PROFILE}/${coordinates}`,
      this.baseUrl,
    );
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("access_token", this.config.accessToken);

    try {
      const response = await this.fetchImpl(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) return null;

      return toRoute((await response.json()) as DirectionsResponse);
    } catch {
      return null;
    }
  }
}

function toRoute(body: DirectionsResponse): Route | null {
  const route = body.code === "Ok" ? body.routes?.[0] : undefined;
  const coordinates = route?.geometry?.coordinates;

  if (
    !route ||
    typeof route.distance !== "number" ||
    typeof route.duration !== "number" ||
    !coordinates ||
    coordinates.length < 2
  ) {
    return null;
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    /* GeoJSON va en [longitud, latitud]; el resto del sitio, en { lat, lng }. */
    path: coordinates.map(([lng, lat]) => ({ lat, lng })),
  };
}
