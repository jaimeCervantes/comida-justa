"use client";

import { useEffect, useRef } from "react";
import { MdClose } from "react-icons/md";
import type { MediaItem } from "~/presentation/media/MediaContent/MediaContent";
import MediaContent from "~/presentation/media/MediaContent/MediaContent";

/**
 * Un archivo a tamaño completo, encima de la pantalla.
 *
 * **No pinta el archivo: se lo pide a `MediaContent`**, el mismo que usan la ficha pública y la
 * galería. Un segundo renderizador habría vuelto a decidir por su cuenta qué hacer con un vídeo y
 * con una foto vertical, y las dos pantallas se habrían separado el día que una de las dos cambiara.
 *
 * **No es un `<dialog>` nativo.** Lo sería de buena gana —trae el foco atrapado y `Escape` de
 * fábrica—, pero `showModal()` no existe en el jsdom con el que corren las pruebas de componente, así
 * que la mitad del comportamiento no se podría comprobar en ninguna parte. Se escribe a mano lo que
 * el nativo daría: `Escape`, el clic en el fondo, el foco al abrir y su devolución al cerrar.
 *
 * El título y la etiqueta de cerrar llegan **como props**: este componente no sabe si lo abre el
 * formulario de publicar o el de editar, y por tanto no puede saber de qué espacio de nombres salen
 * sus textos. Es la misma regla que `loadingLabel` en `Button`.
 */
export default function MediaPreviewDialog({
  item,
  title,
  closeLabel,
  onClose,
}: {
  item: MediaItem;
  /** Cómo se llama esta vista para un lector de pantalla («Archivo 2 en grande»). */
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  /*
   * El foco entra al abrir, y no por cortesía: sin esto el teclado se queda donde estaba —en la
   * miniatura de detrás, que ahora está tapada—, así que `Escape` llegaría a la página y no a esta
   * vista, y tabular seguiría recorriendo un formulario que ya no se ve.
   */
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    /* biome-ignore lint/a11y/useKeyWithClickEvents: el fondo es un atajo de ratón, no un control.
       Lo que hace ya lo hacen `Escape` y el botón de cerrar, que sí son alcanzables con teclado;
       darle un `onKeyDown` propio solo añadiría una parada de tabulación que repite lo que el botón
       de al lado ya ofrece. */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="media-preview"
      /* Solo el fondo cierra, y por eso se compara el objetivo en vez de parar la burbuja en cada
         hijo. Con `onClick={onClose}` a secas, el clic en el botón de cerrar llegaba aquí después de
         hacer lo suyo y `onClose` corría dos veces —inofensivo hoy, y una fuente de fallos el día
         que cerrar haga algo más que apagar un estado—. */
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <button
        type="button"
        ref={closeRef}
        onClick={onClose}
        aria-label={closeLabel}
        className="absolute right-4 top-4 rounded-full bg-surface-elevation-1/90 p-2 text-text-base hover:bg-surface-elevation-1 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <MdClose aria-hidden size={24} />
      </button>

      <div className="max-h-full w-full max-w-3xl overflow-auto">
        <MediaContent media={item} />
      </div>
    </div>
  );
}
