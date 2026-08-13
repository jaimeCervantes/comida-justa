"use client";

import type { VideoHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import {
  MEDIA_FRAME_CLASS,
  MediaSkeleton,
} from "~/presentation/media/MediaSkeleton/MediaSkeleton";

/**
 * Un vídeo que dice que se está cargando.
 *
 * **El `<video>` de HTML no trae esto resuelto**, que es lo primero que uno supone. Lo único nativo
 * parecido es `poster`, una imagen fija que hay que generar y guardar por cada archivo, y aquí no se
 * generan. Sin `poster` y con `preload="metadata"` —que es lo que conviene: descargar el vídeo
 * entero para enseñar una miniatura sería regalarle megas a quien mira desde el teléfono—, lo que
 * queda en pantalla hasta que llegan los metadatos es una caja vacía sin ninguna señal.
 *
 * La señal es `loadedmetadata` y no `loadeddata`: con `preload="metadata"` el navegador se
 * compromete a lo primero, mientras que lo segundo exige tener ya el primer fotograma decodificado y
 * puede no llegar nunca. Esperar por él dejaría el esqueleto latiendo sobre un vídeo listo.
 */
export default function VideoWithSkeleton({
  className,
  frameClassName,
  onLoadedMetadata,
  ...videoProps
}: VideoHTMLAttributes<HTMLVideoElement> & { frameClassName?: string }) {
  const [isSettled, setIsSettled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Lo mismo que en las imágenes: si los metadatos llegaron antes de que React hidratara, el evento
     ya pasó y no vuelve. `HAVE_METADATA` es 1, y de ahí para arriba ya se sabe cuánto dura y cómo de
     grande es, que es todo lo que hace falta para dejar de esperar. */
  useEffect(() => {
    if ((videoRef.current?.readyState ?? 0) >= 1) setIsSettled(true);
  }, []);

  return (
    <span className={cn(MEDIA_FRAME_CLASS, frameClassName)}>
      {isSettled ? null : <MediaSkeleton />}

      {/* Sin `biome-ignore` de `useMediaCaption`, aunque aquí no haya pista de subtítulos: los
          atributos entran por `videoProps`, así que la regla no puede saber qué se pinta y no salta.
          Una supresión que no suprime nada es ruido, y biome la reporta como tal. La razón sigue
          siendo la de siempre: el vídeo lo sube la comunidad y hoy no se capturan subtítulos. */}
      <video
        {...videoProps}
        ref={videoRef}
        className={cn(
          "relative transition-opacity duration-300",
          isSettled ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoadedMetadata={(event) => {
          setIsSettled(true);
          onLoadedMetadata?.(event);
        }}
        onError={() => setIsSettled(true)}
      />
    </span>
  );
}
