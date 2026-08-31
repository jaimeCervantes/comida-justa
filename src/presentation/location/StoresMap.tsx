"use client";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { MappedStore } from "~/domain/entities/seller/map";
import { Heading } from "~/presentation/design_system/typography/Heading";
import StoreMapDetailPanel from "./StoreMapDetailPanel";

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
  const [selectedStoreHandle, setSelectedStoreHandle] = useState<string | null>(
    null,
  );
  const selectedStore = useMemo(
    () => stores.find((store) => store.handle === selectedStoreHandle) ?? null,
    [stores, selectedStoreHandle],
  );

  if (stores.length === 0) return null;

  return (
    <section className={className} data-testid="stores-map">
      <Heading level={2} size="xs" className="mb-2">
        {t(headingKey)}
      </Heading>
      {/* El testid va aquí y no en el `MapContainer`: react-leaflet solo reenvía `className`,
          `id` y `style` al div del mapa, y se come cualquier otro atributo. */}
      <div className="relative">
        <StoresMapCanvas
          visitor={visitor}
          stores={stores}
          selectedStoreHandle={selectedStoreHandle}
          onStoreSelect={setSelectedStoreHandle}
        />

        {selectedStore ? (
          <StoreMapDetailPanel
            className="fixed inset-x-3 bottom-3 z-[60] max-h-[min(78vh,34rem)] overflow-y-auto lg:inset-x-auto lg:bottom-auto lg:right-8 lg:top-28 lg:w-[24rem] lg:max-h-[calc(100vh-8rem)] xl:right-[calc((100vw-80rem)/2+2rem)]"
            store={selectedStore}
            onClose={() => setSelectedStoreHandle(null)}
          />
        ) : null}
      </div>
    </section>
  );
}
