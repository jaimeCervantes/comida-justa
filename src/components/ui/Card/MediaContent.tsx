// components/ui/MediaContent.tsx

type MediaContenProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number
  loading?: 'lazy' | 'eager';
  className?: string;
};

export default function MediaContent({
  src,
  alt,
  width = 300,
  height = 300,
  loading = "lazy"
}: MediaContenProps) {
  const isVideo = src.includes(".mp4");

  if (isVideo) {
    return (
      <video
        controls
        width={width}
        height={height}
        className="h-auto max-w-full w-full object-cover aspect-video"
      >
        <source src={src} type="video/mp4"/>
        Tu navegador no soporta el video 
      </video>
    );
  }

  return (
    <picture>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className="h-auto max-w-full w-full object-cover aspect-video"
      />
    </picture>
  );
}