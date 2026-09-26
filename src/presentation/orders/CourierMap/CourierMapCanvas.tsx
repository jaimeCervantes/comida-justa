"use client";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { CourierLocation } from "~/domain/order/order";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/** Mismo `divIcon` que `StoresMapCanvas`: sin él, Leaflet referencia imágenes que el bundler no
    resuelve y el marcador sale roto. */
const courierIcon = divIcon({
  html: `
    <span class="map-marker map-marker--courier" aria-hidden="true">
      <span class="map-marker__pin">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="5.5" cy="17.5" r="2.5" />
          <circle cx="18.5" cy="17.5" r="2.5" />
          <path d="M8 17.5h7.5M3 17.5V9l2-4h8l3 4h2.5a1.5 1.5 0 0 1 1.5 1.5v7" />
        </svg>
      </span>
      <span class="map-marker__shadow"></span>
    </span>
  `,
  className: "",
  iconSize: [38, 44],
  iconAnchor: [19, 40],
});

const ZOOM = 15;

/**
 * El mapa en sí, sin ajuste de límites: **es un solo punto**, no varios que encuadrar. Por eso no
 * reutiliza `StoresMapCanvas` — su `viewFor` resuelve otra pregunta, dónde caben N tiendas más un
 * visitante, que aquí no existe.
 */
export default function CourierMapCanvas({
  location,
}: {
  location: CourierLocation;
}) {
  return (
    <Surface radius="chip" className="overflow-hidden">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={ZOOM}
        scrollWheelZoom={false}
        className="relative isolate z-0 h-64 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnMove lat={location.lat} lng={location.lng} />
        <Marker position={[location.lat, location.lng]} icon={courierIcon} />
      </MapContainer>
    </Surface>
  );
}

/**
 * `MapContainer` sólo aplica `center`/`zoom` al montarse — es lo que documenta react-leaflet, y lo
 * que hace que el mapa no siguiera al repartidor entre una actualización y la siguiente sin esto.
 * El `Marker` sí es reactivo a su `position`; el encuadre del mapa no, y por eso hace falta el
 * `setView` explícito.
 */
function RecenterOnMove({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng]);
  }, [map, lat, lng]);

  return null;
}
