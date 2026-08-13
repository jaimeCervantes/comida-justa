"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import {
  MEDIA_FRAME_CLASS,
  MediaSkeleton,
} from "~/presentation/media/MediaSkeleton/MediaSkeleton";

/**
 * Una imagen que dice que se está cargando en vez de dejar un hueco en blanco.
 *
 * **El esqueleto va detrás, no en lugar de.** La imagen se pinta encima cuando llega, así que no hay
 * cambio de árbol ni salto de maquetación: el hueco ya tiene su tamaño final —lo reserva
 * `next/image` a partir de `width`/`height`— y lo único que cambia es lo que se ve dentro.
 *
 * **Es un componente de cliente por una razón concreta.** El esqueleto se podría pintar solo con
 * CSS, sin JavaScript ninguno, pero entonces seguiría latiendo para siempre debajo de una imagen ya
 * cargada: en un listado de nueve tarjetas son nueve animaciones infinitas que nadie ve. Con estado,
 * la animación se acaba cuando la imagen llega.
 *
 * Se queda en la hoja del árbol a propósito: quien lo usa —`MediaContent`, `Thumbnail`— puede seguir
 * siendo un componente de servidor.
 */
export default function ImageWithSkeleton({
  className,
  frameClassName,
  onLoad,
  ...imageProps
}: ImageProps & { frameClassName?: string }) {
  const [isSettled, setIsSettled] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  /*
   * La imagen que ya estaba en caché.
   *
   * El navegador puede terminar de decodificarla **antes** de que React hidrate, y entonces el
   * `onLoad` ya ocurrió y no vuelve a ocurrir: el esqueleto se quedaría latiendo debajo de una
   * imagen perfectamente visible, para siempre. `complete` es la pregunta que contesta eso, y hay
   * que hacerla después del primer pintado.
   */
  useEffect(() => {
    if (imageRef.current?.complete) setIsSettled(true);
  }, []);

  return (
    <span className={cn(MEDIA_FRAME_CLASS, frameClassName)}>
      {isSettled ? null : <MediaSkeleton />}

      <Image
        {...imageProps}
        ref={imageRef}
        className={cn(
          "relative transition-opacity duration-300",
          isSettled ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={(event) => {
          setIsSettled(true);
          onLoad?.(event);
        }}
        /* Una imagen rota no puede dejar el esqueleto latiendo eternamente: eso se lee como «sigue
           cargando» y quien mira espera algo que no va a llegar. Se apaga y se ve el hueco. */
        onError={() => setIsSettled(true)}
      />
    </span>
  );
}
