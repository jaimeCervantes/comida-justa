"use client";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { MappedStore } from "~/domain/entities/seller/map";

/**
 * `next/dynamic` con `ssr: false` **no** es aquí una decisión de organización.
 *
 * Leaflet toca `window` en cuanto se importa: renderizarlo en el servidor revienta la página
 * entera. Es el caso que `next/dynamic` existe para resolver, y por eso el mapa vive en su propio
 * módulo (`StoresMapCanvas`) en vez de detrás de un `if` dentro de este.
 */
const StoresMapCanvas = dynamic(() => import("./StoresMapCanvas"), {
  ssr: false,
});

/**
 * Dónde están las tiendas que venden lo que se está buscando.
 *
 * Es el complemento del orden por cercanía: la lista dice cuál está más cerca y el mapa dice si
 * queda de camino, que no es la misma pregunta.
 */
export default function StoresMap({
  visitor,
  stores,
  headingKey = "mapHeading",
  className = "mb-4",
}: {
  /** `null` cuando quien mira no compartió su ubicación. */
  visitor: Coordinates | null;
  stores: readonly MappedStore[];
  /** Qué pregunta contesta este mapa: dónde están varias, o dónde está esta. */
  headingKey?: "mapHeading" | "storeMapHeading";
  className?: string;
}) {
  const t = useTranslations("distance");

  if (stores.length === 0) return null;

  return (
    <section className={className} data-testid="stores-map">
      <h2 className="text-lg font-bold mb-2">{t(headingKey)}</h2>
      {/* El testid va aquí y no en el `MapContainer`: react-leaflet solo reenvía `className`,
          `id` y `style` al div del mapa, y se come cualquier otro atributo. */}
      <StoresMapCanvas visitor={visitor} stores={stores} />
    </section>
  );
}
