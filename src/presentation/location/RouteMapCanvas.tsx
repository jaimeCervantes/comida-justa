"use client";
import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import type { RoutePoint } from "~/domain/entities/post/gpx";

/**
 * Salida y llegada. Del mismo modo que en `StoresMapCanvas`, son `divIcon` de HTML y no las
 * imágenes de Leaflet: sus rutas relativas al CSS del paquete no sobreviven al bundler de Next.
 */
const startIcon = divIcon({
  html: '<span aria-hidden="true" style="font-size:1.25rem">🟢</span>',
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const finishIcon = divIcon({
  html: '<span aria-hidden="true" style="font-size:1.25rem">🏁</span>',
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type Props = {
  points: readonly RoutePoint[];
  startLabel: string;
  finishLabel: string;
};

/**
 * El recorrido dibujado.
 *
 * **El encuadre se calcula del propio trazo** (`bounds`) en vez de fijar centro y zoom: una ruta
 * puede medir 800 metros o 42 kilómetros, y cualquier zoom elegido a mano dejaría fuera la mitad de
 * una de las dos.
 *
 * Marca salida y llegada porque en un circuito cerrado —que es la mitad de las rutas de un grupo—
 * la línea sola no dice por dónde se empieza.
 */
export default function RouteMapCanvas({
  points,
  startLabel,
  finishLabel,
}: Props) {
  if (points.length < 2) return null;

  const positions = points.map(
    (point) => [point.latitude, point.longitude] as [number, number],
  );
  const start = positions[0];
  const finish = positions[positions.length - 1];

  return (
    <MapContainer
      bounds={latLngBounds(positions)}
      boundsOptions={{ padding: [24, 24] }}
      scrollWheelZoom={false}
      className="h-72 w-full rounded-lg"
      data-testid="route-map-canvas"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} pathOptions={{ weight: 4 }} />
      <Marker position={start} icon={startIcon} title={startLabel} />
      <Marker position={finish} icon={finishIcon} title={finishLabel} />
    </MapContainer>
  );
}
