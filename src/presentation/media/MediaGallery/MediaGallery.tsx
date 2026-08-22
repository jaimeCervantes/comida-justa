"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import MediaContent, {
  type MediaItem,
} from "~/presentation/media/MediaContent/MediaContent";

const THUMBNAIL_SIZE = 64;

/**
 * Los archivos de una publicación, uno grande y el resto a mano.
 *
 * **Con uno solo no hay galería.** Devuelve el mismo `MediaContent` de siempre, sin flechas, sin
 * miniaturas y sin contador, porque las 23 publicaciones que hay tienen exactamente un archivo y
 * ninguna debe cambiar de aspecto por una función que no usa. Los adornos aparecen cuando hay algo
 * que recorrer, que es cuando significan algo.
 *
 * No pinta los archivos por su cuenta: eso lo sigue haciendo `MediaContent`, que ya sabe distinguir
 * imagen de vídeo y ya respeta las dimensiones reales cuando se conocen. Esto solo decide cuál se ve.
 */
export default function MediaGallery({
  items,
  className,
  priority = false,
}: {
  items: readonly MediaItem[];
  className?: string;
  /**
   * Que el archivo grande no espere su turno.
   *
   * Es la imagen por la que se entra a la ficha —lo primero que se ve y, casi siempre, la que mide
   * el navegador como "contenido más grande"—, así que ahí sí conviene adelantarla. Las miniaturas
   * no la llevan: son de 64 px y están al lado, no delante.
   */
  priority?: boolean;
}) {
  const t = useTranslations("post");
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback(
    (next: number) => {
      const total = items.length;
      if (total === 0) return;

      /* Un vídeo que se queda sonando detrás de la foto siguiente es el fallo más molesto que puede
         tener un carrusel, y no se ve en una captura de pantalla: solo se oye. */
      containerRef.current?.querySelectorAll("video").forEach((element) => {
        element.pause();
      });

      /* Da la vuelta en los dos extremos: llegar al último y que la flecha siguiente no haga nada se
         lee como que la galería se rompió. */
      setActive(((next % total) + total) % total);
    },
    [items.length],
  );

  if (items.length === 0)
    return <MediaContent media={undefined} className={className} />;

  if (items.length === 1) {
    return (
      <MediaContent
        media={items[0]}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <section
      ref={containerRef}
      className={cn("relative", className)}
      data-testid="media-gallery"
      aria-roledescription={t("galleryRoleDescription")}
      aria-label={t("galleryLabel", { count: items.length })}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          show(active + 1);
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          show(active - 1);
        }
      }}
    >
      <div className="relative">
        <MediaContent
          media={items[active]}
          className="h-auto"
          priority={priority}
        />

        <GalleryArrow
          side="left"
          label={t("galleryPrevious")}
          onClick={() => show(active - 1)}
        />
        <GalleryArrow
          side="right"
          label={t("galleryNext")}
          onClick={() => show(active + 1)}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.url}
            type="button"
            onClick={() => show(index)}
            data-testid="media-gallery-thumbnail"
            /* `aria-current` y no `aria-selected`: esto no es un `tablist` —el archivo grande no es
               un panel con su propio contenido interactivo—, es una lista de atajos a la misma
               vista. */
            aria-current={index === active}
            aria-label={t("galleryGoTo", {
              position: index + 1,
              count: items.length,
            })}
            className={cn(
              "overflow-hidden rounded-chip border-2 focus-visible:outline-2 focus-visible:outline-offset-2",
              index === active
                ? "border-pw-green"
                : "border-transparent opacity-70 hover:opacity-100",
            )}
            style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
          >
            <GalleryThumbnail item={item} />
          </button>
        ))}

        {/* `aria-live` porque cambiar de archivo no recarga nada: sin esto, quien navega con lector
            de pantalla pulsa «siguiente» y no se entera de que pasó algo. */}
        <p
          aria-live="polite"
          data-testid="media-gallery-counter"
          className="ml-auto text-sm text-text-support"
        >
          {t("galleryCounter", { position: active + 1, count: items.length })}
        </p>
      </div>
    </section>
  );
}

function GalleryArrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      {side === "left" ? (
        <MdChevronLeft size={24} aria-hidden />
      ) : (
        <MdChevronRight size={24} aria-hidden />
      )}
    </button>
  );
}

/**
 * La miniatura. Decorativa: quien la nombra es el botón que la envuelve, con su posición dentro.
 *
 * No usa `Thumbnail` porque aquel impone su propio tamaño con `style` y aquí el tamaño lo pone el
 * botón; y porque un vídeo no cabe en él, que es deliberado —`Thumbnail` es solo para imágenes—.
 */
function GalleryThumbnail({ item }: { item: MediaItem }) {
  if (item.type === "video") {
    return (
      <video
        src={item.url}
        muted
        preload="metadata"
        aria-hidden
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: miniatura de 64 px de una galería ya cargada; `next/image` añadiría una segunda petición optimizada por cada archivo para ahorrar unos kilobytes de algo que el navegador ya tiene en caché desde la vista grande.
    <img
      src={item.url}
      alt=""
      aria-hidden
      className="h-full w-full object-cover"
    />
  );
}
