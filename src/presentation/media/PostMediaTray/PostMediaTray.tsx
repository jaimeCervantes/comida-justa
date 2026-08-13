"use client";

import { useTranslations } from "next-intl";
import { MdClose } from "react-icons/md";
import {
  MAX_POST_MEDIA_FILES,
  mediaTypeFromMime,
} from "~/domain/entities/post/mediaPayload";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import Thumbnail from "~/presentation/media/Thumbnail/Thumbnail";

/** Un archivo ya subido, tal y como lo devuelve `useStorageUpload`. */
export interface PostMediaTrayItem {
  url: string;
  /** El MIME (`image/jpeg`) o ya la categoría (`image`); las dos formas se reducen igual. */
  type: string;
}

const THUMBNAIL_SIZE = 88;

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
  max = MAX_POST_MEDIA_FILES,
  className,
}: {
  items: readonly PostMediaTrayItem[];
  onRemove: (index: number) => void;
  max?: number;
  className?: string;
}) {
  const t = useTranslations("publish");

  if (items.length === 0) return null;

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
            className="relative"
          >
            <MediaThumbnail item={item} />

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
              className="absolute -right-2 -top-2 rounded-full bg-gray-900 p-1 text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <MdClose aria-hidden />
            </button>
          </li>
        ))}
      </ol>

      {/* `aria-live` porque el número cambia sin que se recargue nada: quien usa lector de pantalla
          se entera de que la subida terminó o de que quitó un archivo. */}
      <p
        aria-live="polite"
        data-testid="post-media-tray-counter"
        className="mt-2 text-sm text-gray-600 dark:text-gray-400"
      >
        {t("mediaCounter", { count: items.length, max })}
        {items.length >= max ? ` ${t("mediaLimitReached")}` : ""}
      </p>
    </section>
  );
}

/**
 * La miniatura. `Thumbnail` solo hace imágenes —y es decorativa a propósito—, que es justo lo que
 * hace falta aquí: quien la nombra es el botón de quitar que tiene al lado, con su posición dentro.
 * El vídeo no cabe en ella sin convertirla en otra cosa, así que se pinta aquí su fotograma.
 */
function MediaThumbnail({ item }: { item: PostMediaTrayItem }) {
  if (mediaTypeFromMime(item.type) === "video") {
    return (
      <video
        src={item.url}
        muted
        preload="metadata"
        aria-hidden
        className={cn("shrink-0 rounded-lg object-cover")}
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
