"use client";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { describeDistance } from "~/domain/entities/seller/distance";
import { type MappedStore, viewFor } from "~/domain/entities/seller/map";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/**
 * Pines de HTML y no las imágenes que trae Leaflet.
 *
 * Los iconos por defecto se referencian por ruta relativa al CSS del paquete, y con el bundler de
 * Next esa ruta no existe: salen mapas con marcadores rotos. Un `divIcon` no depende de ningún
 * asset, así que no hay nada que se pueda romper al mover un archivo.
 */
const storeIcon = divIcon({
  html: `
    <span class="map-marker map-marker--store" aria-hidden="true">
      <span class="map-marker__pin">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10h16" />
          <path d="M5 10l1.3-5h11.4L19 10" />
          <path d="M6 10v9h12v-9" />
          <path d="M9 19v-5h6v5" />
        </svg>
      </span>
      <span class="map-marker__shadow"></span>
    </span>
  `,
  className: "",
  iconSize: [38, 44],
  iconAnchor: [19, 40],
});

const visitorIcon = divIcon({
  html: `
    <span class="map-marker map-marker--visitor" aria-hidden="true">
      <span class="map-marker__pin">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
        </svg>
      </span>
      <span class="map-marker__shadow"></span>
    </span>
  `,
  className: "",
  iconSize: [38, 44],
  iconAnchor: [19, 40],
});

/**
 * El mapa en sí. Vive aparte de `StoresMap` porque Leaflet toca `window` al importarse y solo
 * puede cargarse en el cliente: el envoltorio es el que lo trae con `next/dynamic`.
 */
export default function StoresMapCanvas({
  visitor,
  stores,
}: {
  /** `null` cuando quien mira no compartió su ubicación: el mapa sigue valiendo, sin su pin. */
  visitor: Coordinates | null;
  stores: readonly MappedStore[];
}) {
  const t = useTranslations("distance");
  const view = viewFor(visitor, stores);

  if (!view) return null;

  return (
    /*
     * El radio lo decide el design system, no este archivo.
     *
     * Era el `rounded-*` que `pendientes.md` dejó marcado: el mapa se pintaba con `rounded-lg`
     * escrito a mano mientras tarjetas, paneles y paginación ya pasaban por `Surface`. Da igual
     * que el valor coincidiera hoy — una esquina que no se puede cambiar desde `layout.css` es una
     * esquina que se va a quedar atrás la próxima vez que cambie el radio del sitio.
     *
     * El envoltorio existe porque `MapContainer` no acepta `as`: `Surface` pone el radio y recorta,
     * y el mapa se queda con lo suyo —el tamaño y el aislamiento—.
     */
    <Surface radius="chip" className="overflow-hidden">
      <MapContainer
        {...(view.kind === "bounds"
          ? {
              bounds: [
                [
                  view.bounds.southWest.latitude,
                  view.bounds.southWest.longitude,
                ],
                [
                  view.bounds.northEast.latitude,
                  view.bounds.northEast.longitude,
                ],
              ] as [[number, number], [number, number]],
              boundsOptions: { padding: [32, 32] as [number, number] },
            }
          : {
              center: [view.center.latitude, view.center.longitude] as [
                number,
                number,
              ],
              zoom: view.zoom,
            })}
        scrollWheelZoom={false}
        /*
         * `isolate` no es cosmético: sin él el mapa tapa el submenú del header.
         *
         * Leaflet apila sus capas con z-index de 400 a 700, y sin un contexto de apilamiento propio
         * esos números compiten en la raíz contra el `z-50` del header — y 400 gana. Al aislar, todo
         * lo de Leaflet queda dentro de un contexto que vale 0, y el desplegable pasa por encima.
         */
        className="relative isolate z-0 h-72 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visitor ? (
          <Marker
            position={[visitor.latitude, visitor.longitude]}
            icon={visitorIcon}
          >
            <Popup>{t("youAreHere")}</Popup>
          </Marker>
        ) : null}

        {stores.map((store) => {
          const described =
            store.meters === null ? null : describeDistance(store.meters);

          return (
            <Marker
              key={store.handle}
              position={[
                store.coordinates.latitude,
                store.coordinates.longitude,
              ]}
              icon={storeIcon}
            >
              <Popup>
                <a href={`/tienda/${store.handle}`} className="font-semibold">
                  {store.name}
                </a>
                {described ? (
                  <span className="block">
                    {described.unit === "meters"
                      ? t("meters", { value: described.value })
                      : t("kilometers", { value: described.value })}
                  </span>
                ) : null}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Surface>
  );
}
