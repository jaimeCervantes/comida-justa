"use client";
import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds } from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { CourierLocation, DeliveryLocation } from "~/domain/order/order";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/** Mismo `divIcon` que `StoresMapCanvas`: sin él, Leaflet referencia imágenes que el bundler no
    resuelve y el marcador sale roto. */
const courierIcon = divIcon({
  html: `
    <span class="map-marker map-marker--courier" data-testid="map-marker-courier" aria-hidden="true">
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

/** El destino es quien compró: mismo marcador que "Aquí estás tú" en el mapa de tiendas. */
const destinationIcon = divIcon({
  html: `
    <span class="map-marker map-marker--visitor" data-testid="map-marker-destination" aria-hidden="true">
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

const ZOOM = 15;

/** Holgura alrededor de los dos puntos al encuadrarlos, para que ningún marcador quede en el borde. */
const FIT_PADDING: [number, number] = [48, 48];

/**
 * El mapa en sí: el repartidor y, si el comprador lo compartió, el destino.
 *
 * **La línea que los une es recta y punteada a propósito**: es la misma recta sobre la que se
 * calcula la distancia, no un camino por calles, y el punteado es lo que evita que se lea como uno.
 *
 * No reutiliza `StoresMapCanvas`: su `viewFor` resuelve otra pregunta —dónde caben N tiendas más un
 * visitante—, y aquí son uno o dos puntos que se mueven.
 */
export default function CourierMapCanvas({
  location,
  destination = null,
}: {
  location: CourierLocation;
  destination?: DeliveryLocation | null;
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
        <FollowCourier courier={location} destination={destination} />
        {destination ? (
          <>
            <Polyline
              positions={[
                [location.lat, location.lng],
                [destination.lat, destination.lng],
              ]}
              pathOptions={{ className: "courier-straight-line" }}
            />
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            />
          </>
        ) : null}
        <Marker position={[location.lat, location.lng]} icon={courierIcon} />
      </MapContainer>
    </Surface>
  );
}

/**
 * `MapContainer` sólo aplica `center`/`zoom` al montarse — es lo que documenta react-leaflet, y lo
 * que hace que el mapa no siguiera al repartidor entre una actualización y la siguiente sin esto.
 * Los `Marker` sí son reactivos a su `position`; el encuadre del mapa no, y por eso hace falta
 * moverlo a mano: centrado en el repartidor si está solo, o encuadrando a los dos si hay destino.
 */
function FollowCourier({
  courier,
  destination,
}: {
  courier: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const { lat, lng } = courier;
  const destinationLat = destination?.lat ?? null;
  const destinationLng = destination?.lng ?? null;

  useEffect(() => {
    if (destinationLat === null || destinationLng === null) {
      map.setView([lat, lng]);
      return;
    }

    map.fitBounds(
      latLngBounds([
        [lat, lng],
        [destinationLat, destinationLng],
      ]),
      { padding: FIT_PADDING, maxZoom: ZOOM },
    );
  }, [map, lat, lng, destinationLat, destinationLng]);

  return null;
}
