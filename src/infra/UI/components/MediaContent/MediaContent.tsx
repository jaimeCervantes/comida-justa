import Image from "next/image";
import { ComponentType } from "react";

export interface MediaItem {
  type: "video" | "image" | "audio" | string;
  url: string;
  alt: string;
}

interface MediaContentProps {
  media: MediaItem;
  className?: string;
}

export default function MediaContent({ media, className }: MediaContentProps) {
  const contentTypes: Record<string, ComponentType<MediaContentProps>> = {
    video: VideoContent,
    image: ImageContent,
    audio: AudioContent,
    default: DefaultContent,
  };

  const ContentRenderer = contentTypes[media?.type] || contentTypes.default;

  return (
    <div className="sj-media-wrapper">
      <ContentRenderer media={media} className={className} />
    </div>
  );
}

function VideoContent({ media, className }: MediaContentProps) {
  return (
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
