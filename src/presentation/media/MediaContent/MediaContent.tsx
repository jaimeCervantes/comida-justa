import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { hasKnownAspect } from "~/domain/entities/post/mediaAspect";
import ImageWithSkeleton from "~/presentation/media/ImageWithSkeleton/ImageWithSkeleton";
import VideoWithSkeleton from "~/presentation/media/VideoWithSkeleton/VideoWithSkeleton";

export interface MediaItem {
  type: "video" | "image" | "audio" | string;
  url: string;
  alt: string;
  /**
   * Las dimensiones reales, si se saben. Nulas en los vídeos y en lo publicado antes de que el
   * formulario las capture. **Nulo no es "es cuadrada"**: sin ellas se cae al alto fijo de siempre.
   */
  width?: number | null;
  height?: number | null;
}

interface MediaContentProps {
  media: MediaItem;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Cuánto va a ocupar la imagen en pantalla, para que el navegador no se traiga la variante de 3840
 * píxeles y la encoja.
 *
 * Sin `sizes`, `next/image` construye el `srcset` y deja que el navegador elija **sin saber el hueco
 * real**, así que elige por ancho de ventana: en un portátil, la de 1920 o más para una tarjeta que
 * mide 380. El valor de aquí cubre los dos usos de siempre —a pantalla completa en el teléfono, y a
 * lo ancho de la columna de la ficha en escritorio—; quien tenga un hueco muy distinto lo pasa.
 */
const DEFAULT_SIZES = "(max-width: 768px) 100vw, 768px";

export default function MediaContent({
  media,
  className,
  priority = false,
  sizes = DEFAULT_SIZES,
}: {
  /** Puede faltar: una publicación sembrada o migrada sin media es un caso real. */
  media: MediaItem | undefined;
  className?: string;
  /**
   * Solo para la que se ve sin desplazarse. Adelanta la descarga y desactiva la carga diferida, así
   * que ponerla en una lista es pedirlo todo a la vez y volver a la avalancha que había antes.
   */
  priority?: boolean;
  sizes?: string;
}) {
  const t = useTranslations("post");
  const contentTypes: Record<string, ComponentType<MediaContentProps>> = {
    video: VideoContent,
    image: ImageContent,
    audio: AudioContent,
    default: DefaultContent,
  };

  // Sin URL no hay nada que pintar y `next/image` lanzaría con `src=""`. Antes se dejaba pasar
  // el `undefined` a `DefaultContent`, que leía `media.url` y tumbaba el listado entero con un
  // 500 (ver `docs/planning/001-2026-07-30-pendientes.md`).
  if (!media?.url) {
    return (
      <div
        data-testid="media-placeholder"
        className={`sj-media-wrapper flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 ${className || ""}`}
      >
        {t("noImage")}
      </div>
    );
  }

  const ContentRenderer = contentTypes[media.type] || contentTypes.default;

  return (
    <div className="sj-media-wrapper">
      <ContentRenderer
        media={media}
        className={className}
        priority={priority}
        sizes={sizes}
      />
    </div>
  );
}

function VideoContent({ media, className }: MediaContentProps) {
  return (
    <VideoWithSkeleton
      src={media.url}
      title={media.alt}
      controls
      /* Metadatos y nada más. Descargar el vídeo entero para que se vea el primer fotograma le
         regalaría megas a quien mira desde el teléfono, y en una ficha con tres vídeos, tres veces. */
      preload="metadata"
      frameClassName="w-full"
      className={`w-full aspect-video ${className || ""}`}
    >
      Tu navegador no soporta HTML5.
    </VideoWithSkeleton>
  );
}

/**
 * Cuando no se sabe la forma del archivo.
 *
 * Es un cuadrado, y era el ÚNICO trato que recibían todas: `next/image` deriva la proporción del
 * hueco de estos dos números, así que declararlos iguales para una foto de 1200x1600 la anunciaba
 * cuadrada. Sigue aquí porque es la verdad disponible para los vídeos y para lo que se publicó sin
 * medir, y porque quien lo pinta lo acompaña de un alto fijo que recorta con `object-cover`.
 */
const UNKNOWN_SIZE = { width: 1000, height: 1000 } as const;

function ImageContent({
  media,
  className,
  priority,
  sizes,
}: MediaContentProps) {
  const known = hasKnownAspect(media);

  return (
    <ImageWithSkeleton
      src={media.url}
      alt={media.alt}
      /* Con las reales, el hueco nace ya con la proporción del archivo y no hay nada que recortar.
         `object-cover` solo actúa cuando alguien impone un alto, que es justo lo que deja de
         hacerse en cuanto se sabe la forma. */
      width={known ? Number(media.width) : UNKNOWN_SIZE.width}
      height={known ? Number(media.height) : UNKNOWN_SIZE.height}
      /*
       * Diferida salvo que quien la pinta diga lo contrario.
       *
       * Antes iban **todas** en `eager`, y eso no era una optimización sino su contrario: un listado
       * de nueve tarjetas abría nueve descargas en el primer pintado, todas compitiendo por el mismo
       * ancho de banda, y la que la persona estaba mirando llegaba la última. Ahora solo se adelanta
       * la que se ve sin desplazarse, y quien lo sabe es quien la coloca.
       */
      priority={priority}
      sizes={sizes}
      data-testid={known ? "media-image-sized" : "media-image-unsized"}
      frameClassName="w-full"
      className={`w-full ${known ? "h-auto" : "object-cover"} ${className || ""}`}
    />
  );
}

function AudioContent({ media, className }: MediaContentProps) {
  return (
    // biome-ignore lint/a11y/useMediaCaption: el audio lo sube la comunidad; hoy no se capturan pistas de subtítulos.
    <audio
      src={media.url}
      title={media.alt}
      controls
      className={`w-full h-auto ${className || ""}`}
    >
      Tu navegador no soporta HTML5.
    </audio>
  );
}

function DefaultContent({ media, className }: MediaContentProps) {
  return (
    <div className={`flex items-center justify-center p-2 ${className || ""}`}>
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {media.alt || "Descargar archivo"}
      </a>
    </div>
  );
}
