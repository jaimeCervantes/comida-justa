"use client";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { describeDistance } from "~/domain/entities/seller/distance";
import { boundsFor, type MappedStore } from "~/domain/entities/seller/map";

/**
 * Pines de HTML y no las imágenes que trae Leaflet.
 *
 * Los iconos por defecto se referencian por ruta relativa al CSS del paquete, y con el bundler de
 * Next esa ruta no existe: salen mapas con marcadores rotos. Un `divIcon` no depende de ningún
 * asset, así que no hay nada que se pueda romper al mover un archivo.
 */
const storeIcon = divIcon({
  html: '<span aria-hidden="true" style="font-size:1.5rem">🏪</span>',
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const visitorIcon = divIcon({
  html: '<span aria-hidden="true" style="font-size:1.25rem">📍</span>',
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * El mapa en sí. Vive aparte de `StoresMap` porque Leaflet toca `window` al importarse y solo
 * puede cargarse en el cliente: el envoltorio es el que lo trae con `next/dynamic`.
 */
export default function StoresMapCanvas({
  visitor,
  stores,
}: {
  visitor: Coordinates;
  stores: readonly MappedStore[];
}) {
  const t = useTranslations("distance");
  const bounds = boundsFor(visitor, stores);

  if (!bounds) return null;

  return (
    <MapContainer
      bounds={[
        [bounds.southWest.latitude, bounds.southWest.longitude],
        [bounds.northEast.latitude, bounds.northEast.longitude],
      ]}
      boundsOptions={{ padding: [32, 32] }}
      scrollWheelZoom={false}
      /*
       * `isolate` no es cosmético: sin él el mapa tapa el submenú del header.
       *
       * Leaflet apila sus capas con z-index de 400 a 700, y sin un contexto de apilamiento propio
       * esos números compiten en la raíz contra el `z-50` del header — y 400 gana. Al aislar, todo
       * lo de Leaflet queda dentro de un contexto que vale 0, y el desplegable pasa por encima.
       */
      className="relative isolate z-0 h-72 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[visitor.latitude, visitor.longitude]}
        icon={visitorIcon}
      >
        <Popup>{t("youAreHere")}</Popup>
      </Marker>

      {stores.map((store) => {
        const described = describeDistance(store.meters);

        return (
          <Marker
            key={store.handle}
            position={[store.coordinates.latitude, store.coordinates.longitude]}
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
  );
}
