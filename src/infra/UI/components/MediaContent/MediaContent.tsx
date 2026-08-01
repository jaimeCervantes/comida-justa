import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

export interface MediaItem {
  type: "video" | "image" | "audio" | string;
  url: string;
  alt: string;
}

interface MediaContentProps {
  media: MediaItem;
  className?: string;
}

export default function MediaContent({
  media,
  className,
}: {
  /** Puede faltar: una publicación sembrada o migrada sin media es un caso real. */
  media: MediaItem | undefined;
  className?: string;
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
  // 500 (ver `docs/pendientes.md`).
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
      <ContentRenderer media={media} className={className} />
    </div>
  );
}

function VideoContent({ media, className }: MediaContentProps) {
  return (
    // biome-ignore lint/a11y/useMediaCaption: el video lo sube la comunidad; hoy no se capturan pistas de subtítulos.
    <video
      src={media.url}
      title={media.alt}
      controls
      className={`w-full aspect-video ${className || ""}`}
    >
      Tu navegador no soporta HTML5.
    </video>
  );
}

function ImageContent({ media, className }: MediaContentProps) {
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={1000}
      height={1000}
      loading="eager"
      className={`w-full object-cover ${className || ""}`}
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
