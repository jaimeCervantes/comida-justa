"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";
import {
  MAX_POST_MEDIA_FILES,
  mediaTypeFromMime,
} from "~/domain/entities/post/mediaPayload";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import MediaPreviewDialog from "~/presentation/media/MediaPreviewDialog/MediaPreviewDialog";
import Thumbnail from "~/presentation/media/Thumbnail/Thumbnail";
import VideoWithSkeleton from "~/presentation/media/VideoWithSkeleton/VideoWithSkeleton";

/** Un archivo ya subido, tal y como lo devuelve `useStorageUpload`. */
export interface PostMediaTrayItem {
  url: string;
  /** El MIME (`image/jpeg`) o ya la categoría (`image`); las dos formas se reducen igual. */
  type: string;
}

/**
 * 112 px, y no los 88 con los que nació.
 *
 * Con 88 se distingue que hay tres archivos, pero no *cuál* es cada uno: tres etiquetas del mismo
 * frasco se ven idénticas a ese tamaño, y quien edita tiene que acertar a la primera cuál quita. Se
 * queda corta a propósito de todos modos —la bandeja es un índice, no una galería—; para mirar de
 * verdad está la vista grande.
 */
const THUMBNAIL_SIZE = 112;

/**
 * Los archivos que lleva la publicación mientras se escribe, en su orden.
 *
 * El orden **es** el dato: el índice acaba en `post_media.sort_order` y el primero es la portada que
 * piden la tarjeta del listado, el carrito y el bot. Por eso cada archivo enseña su número en vez de
 * limitarse a estar en una fila: quien publica tiene que poder ver cuál va a quedar de portada sin
 * enviar el formulario y volver.
 *
 * Es la única vista de lo elegido. La previa local del selector se apaga con `multiple` justo para
 * que no haya dos sitios contando la misma cosa.
 */
export default function PostMediaTray({
  items,
  onRemove,
  onMove,
  max = MAX_POST_MEDIA_FILES,
  className,
}: {
  items: readonly PostMediaTrayItem[];
  onRemove: (index: number) => void;
  /**
   * Mueve el archivo de `from` a `to`. Opcional: sin él la bandeja no ofrece reordenar —ni flechas
   * ni arrastre—, que es como nació en el slice 1.
   */
  onMove?: (from: number, to: number) => void;
  max?: number;
  className?: string;
}) {
  const t = useTranslations("publish");

  /** Cuál está abierto en grande. `null` es "ninguno", que es casi siempre. */
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  /**
   * De dónde salió el arrastre.
   *
   * En una `ref` y no en el estado porque **no se pinta con ella**: cambia en cada `dragover` y un
   * `setState` por evento repintaría la lista entera decenas de veces mientras se arrastra. Lo que sí
   * se pinta —cuál se está arrastrando— va aparte y cambia una vez al empezar y otra al soltar.
   */
  const dragFrom = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  /** Las miniaturas, para devolverles el foco al cerrar la vista grande. */
  const previewButtons = useRef<Array<HTMLButtonElement | null>>([]);

  const closePreview = useCallback(() => {
    const opened = previewIndex;

    setPreviewIndex(null);

    /* El foco vuelve a la miniatura desde la que se abrió. Sin esto aterriza en `body`, y quien
       navega con teclado tiene que recorrer el formulario entero para volver a donde estaba. */
    if (opened !== null) previewButtons.current[opened]?.focus();
  }, [previewIndex]);

  const handleDrop = useCallback(
    (to: number) => (event: React.DragEvent<HTMLLIElement>) => {
      event.preventDefault();

      /* La `ref` es la fuente buena; `dataTransfer` es el respaldo para un arrastre que venga de
         fuera de este componente y para los navegadores que limpian la ref antes del `drop`. */
      const carried = Number(event.dataTransfer?.getData("text/plain"));
      const from =
        dragFrom.current ?? (Number.isInteger(carried) ? carried : null);

      dragFrom.current = null;
      setDraggingIndex(null);

      // Soltar un archivo sobre sí mismo no es un cambio, y llamar a `onMove` lo haría parecer uno.
      if (from === null || from === to) return;

      onMove?.(from, to);
    },
    [onMove],
  );

  if (items.length === 0) return null;

  const preview = previewIndex === null ? undefined : items[previewIndex];

  return (
    <section className={className} data-testid="post-media-tray">
      <ol className="flex flex-wrap gap-3">
        {items.map((item, index) => (
          <li
            // La URL de Cloud Storage ya es única por archivo —lleva marca de tiempo y un
            // discriminante—, así que identifica la fila mejor que el índice, que se recicla al
            // quitar uno de en medio y haría que React reutilizara el nodo equivocado.
            key={item.url}
            data-testid="post-media-tray-item"
            draggable={onMove ? true : undefined}
            onDragStart={
              onMove
                ? (event) => {
                    dragFrom.current = index;
                    setDraggingIndex(index);
                    event.dataTransfer?.setData("text/plain", String(index));
                    if (event.dataTransfer)
                      event.dataTransfer.effectAllowed = "move";
                  }
                : undefined
            }
            // Sin `preventDefault` el navegador no considera esta fila un destino válido y el
            // `drop` no llega nunca: es el requisito menos evidente del arrastrar y soltar de HTML5.
            onDragOver={
              onMove
                ? (event) => {
                    event.preventDefault();
                    if (event.dataTransfer)
                      event.dataTransfer.dropEffect = "move";
                  }
                : undefined
            }
            onDrop={onMove ? handleDrop(index) : undefined}
            onDragEnd={
              onMove
                ? () => {
                    dragFrom.current = null;
                    setDraggingIndex(null);
                  }
                : undefined
            }
            className={cn(
              "relative",
              onMove && "cursor-grab active:cursor-grabbing",
              draggingIndex === index && "opacity-40",
            )}
          >
            <button
              type="button"
              ref={(node) => {
                previewButtons.current[index] = node;
              }}
              onClick={() => setPreviewIndex(index)}
              aria-label={t("mediaPreview", { position: index + 1 })}
              className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <MediaThumbnail item={item} />
            </button>

            <span
              aria-hidden
              className="absolute left-1 top-1 rounded-full bg-black/70 px-2 text-xs leading-5 text-white"
            >
              {index + 1}
            </span>

            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={t("mediaRemove", { position: index + 1 })}
              className="absolute -right-2 -top-2 rounded-full bg-brand-black p-1 text-pw-white hover:bg-brand-clay-700 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <MdClose aria-hidden />
            </button>

            {/* Los dos de mover. Solo se pintan donde pueden hacer algo: un botón deshabilitado en
                cada extremo sería ruido en una fila que ya tiene una insignia y una cruz por
                archivo, y el foco del teclado tendría que pasar por él para nada.

                **No sobran ahora que se puede arrastrar**: son el único camino con teclado y con
                lector de pantalla, y cambiar una mejora de ratón por una regresión de accesibilidad
                no es un cambio que valga la pena. */}
            {onMove ? (
              <span className="absolute inset-x-0 bottom-1 flex justify-between px-1">
                {index > 0 ? (
                  <MoveButton
                    label={t("mediaMoveEarlier", { position: index + 1 })}
                    onClick={() => onMove(index, index - 1)}
                  >
                    <MdChevronLeft aria-hidden />
                  </MoveButton>
                ) : (
                  <span />
                )}

                {index < items.length - 1 ? (
                  <MoveButton
                    label={t("mediaMoveLater", { position: index + 1 })}
                    onClick={() => onMove(index, index + 1)}
                  >
                    <MdChevronRight aria-hidden />
                  </MoveButton>
                ) : (
                  <span />
                )}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Arrastrar no se ve: no hay nada en la pantalla que diga que se puede, y quien no lo intente
          nunca lo descubrirá. Solo con más de uno, que es cuando hay algo que ordenar. */}
      {onMove && items.length > 1 ? (
        <p
          data-testid="post-media-tray-hint"
          className="mt-2 text-sm text-text-support"
        >
          {t("mediaDragHint")}
        </p>
      ) : null}

      {/* `aria-live` porque el número cambia sin que se recargue nada: quien usa lector de pantalla
          se entera de que la subida terminó o de que quitó un archivo. */}
      <p
        aria-live="polite"
        data-testid="post-media-tray-counter"
        className="mt-2 text-sm text-text-support"
      >
        {t("mediaCounter", { count: items.length, max })}
        {items.length >= max ? ` ${t("mediaLimitReached")}` : ""}
      </p>

      {preview && previewIndex !== null ? (
        <MediaPreviewDialog
          item={{
            url: preview.url,
            /* `MediaContent` conmuta por categoría (`image`, `video`), y aquí el tipo todavía puede
               ser el MIME que trajo el archivo recién subido. */
            type: mediaTypeFromMime(preview.type),
            alt: t("mediaPreviewTitle", { position: previewIndex + 1 }),
          }}
          title={t("mediaPreviewTitle", { position: previewIndex + 1 })}
          closeLabel={t("mediaPreviewClose")}
          onClose={closePreview}
        />
      ) : null}
    </section>
  );
}

/**
 * Uno de los dos botones de mover.
 *
 * La etiqueta la escribe quien lo pinta y ya lleva la posición dentro («Mover el archivo 2 antes»):
 * dos flechas idénticas por archivo son inservibles con lector de pantalla, que es el mismo motivo
 * por el que el botón de quitar dice cuál quita.
 */
function MoveButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-full bg-black/70 p-0.5 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </button>
  );
}

/**
 * La miniatura. `Thumbnail` solo hace imágenes —y es decorativa a propósito—, que es justo lo que
 * hace falta aquí: quien la nombra es el botón que la envuelve, con su posición dentro.
 * El vídeo no cabe en ella sin convertirla en otra cosa, así que se pinta aquí su fotograma.
 */
function MediaThumbnail({ item }: { item: PostMediaTrayItem }) {
  if (mediaTypeFromMime(item.type) === "video") {
    return (
      <VideoWithSkeleton
        src={item.url}
        muted
        preload="metadata"
        aria-hidden
        frameClassName="shrink-0 rounded-lg"
        className={cn("rounded-lg object-cover")}
        style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
      />
    );
  }

  return (
    <Thumbnail
      url={item.url}
      size={THUMBNAIL_SIZE}
      testId="post-media-tray-thumbnail"
    />
  );
}
