"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cuánto hay que sostener el dedo antes de que la bandeja entienda «arrastrar» y no «desplazar».
 *
 * 350 ms es el mismo orden que usa el reordenar de un teléfono: por debajo, cualquier deslizamiento
 * para bajar por el formulario secuestraría una miniatura; por encima, la persona suelta antes de
 * que pase nada y concluye que no se puede.
 */
const TOUCH_HOLD_MS = 350;

/** Lo que se le perdona al dedo mientras sostiene: un pulgar apoyado nunca está del todo quieto. */
const TOUCH_TOLERANCE_PX = 10;

/** Con ratón no hay ambigüedad: apretar y mover ya es arrastrar, sin esperas. */
const MOUSE_THRESHOLD_PX = 6;

interface Gesture {
  index: number;
  pointerId: number;
  pointerType: string;
  x: number;
  y: number;
}

export interface PointerReorder {
  /** Va en el `<ol>`: es donde se bloquea el desplazamiento mientras se arrastra. */
  registerList: (node: HTMLOListElement | null) => void;
  /** Va en cada `<li>`: sus medidas son las que dicen sobre cuál se está soltando. */
  registerItem: (index: number) => (node: HTMLLIElement | null) => void;
  /** El `onPointerDown` de cada `<li>`. */
  startDrag: (index: number) => (event: React.PointerEvent) => void;
  /** Cuál se está arrastrando, para pintarlo levantado. `null` casi siempre. */
  draggingIndex: number | null;
  /** Sobre cuál está el dedo ahora mismo, para decir dónde va a caer. */
  overIndex: number | null;
  /**
   * Si el clic que acaba de llegar es la cola de un arrastre y no un toque.
   *
   * Sin esto, soltar una miniatura encima de otra abría la vista grande justo después de
   * reordenar: el navegador emite `click` al final de un arrastre con ratón igual que al final de
   * un toque, y desde el `onClick` los dos son indistinguibles.
   */
  shouldIgnoreClick: () => boolean;
}

/**
 * Reordenar arrastrando, con el dedo y con el ratón, por el mismo camino.
 *
 * **Sustituye al arrastrar y soltar de HTML5, que no existe al tacto.** `draggable` + `dragstart`
 * es una API de escritorio: ningún navegador móvil la emite para un dedo, así que la bandeja se
 * ordenaba arrastrando sólo con ratón mientras la pista de la pantalla se lo prometía a todo el
 * mundo. Se comprobó en Chromium de verdad —con ratón reordenaba en publicar y en editar; con el
 * dedo, medido por CDP en un viewport de teléfono, no pasaba nada—. Los eventos de puntero son una
 * sola API para las dos entradas, y de paso los conduce Playwright, que es lo que permite que esto
 * tenga una prueba de navegador en vez de sólo una de jsdom.
 *
 * **El dedo tiene que sostener; el ratón no.** Es la única forma de que un deslizamiento sobre la
 * bandeja siga desplazando la página: mientras nadie sostiene, el gesto es de la página; a los
 * {@link TOUCH_HOLD_MS} pasa a ser de la miniatura. Moverse antes de ese plazo abandona el gesto,
 * porque eso es exactamente lo que hace quien está bajando por el formulario.
 *
 * Las flechas ‹ › siguen siendo el camino con teclado y con lector de pantalla, y no se tocan: esto
 * añade una entrada, no sustituye la que ya servía.
 */
export function usePointerReorder(
  onMove?: (from: number, to: number) => void,
): PointerReorder {
  const [list, setList] = useState<HTMLOListElement | null>(null);
  const items = useRef<Array<HTMLLIElement | null>>([]);

  /*
   * El gesto en curso va en `ref` y no en el estado porque **no se pinta con él**: cambia en cada
   * `pointermove`, y un `setState` por evento repintaría la bandeja entera decenas de veces por
   * segundo. Lo que sí se pinta —cuál se levanta y sobre cuál cae— se calcula a partir de esto y
   * cambia como mucho una vez por miniatura recorrida.
   */
  const gesture = useRef<Gesture | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = useRef(false);
  const dropTarget = useRef<number | null>(null);
  const justDragged = useRef(false);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);

    holdTimer.current = null;
    gesture.current = null;
    isActive.current = false;
    dropTarget.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }, []);

  const activate = useCallback((index: number) => {
    isActive.current = true;
    setDraggingIndex(index);
  }, []);

  const registerItem = useCallback(
    (index: number) => (node: HTMLLIElement | null) => {
      items.current[index] = node;
    },
    [],
  );

  const startDrag = useCallback(
    (index: number) => (event: React.PointerEvent) => {
      if (!onMove) return;
      // Solo el botón principal: con el secundario se abre el menú del navegador, no se ordena.
      if (event.button !== 0) return;

      /* La cruz y las dos flechas viven dentro de la misma fila. Sin esta salida, sostener el dedo
         sobre una flecha —que es lo que hace quien no está seguro de haberla tocado— levantaría la
         miniatura en vez de moverla un puesto. */
      if ((event.target as HTMLElement).closest?.("[data-tray-control]"))
        return;

      gesture.current = {
        index,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        x: event.clientX,
        y: event.clientY,
      };
      dropTarget.current = null;
      justDragged.current = false;

      if (event.pointerType === "touch") {
        holdTimer.current = setTimeout(() => activate(index), TOUCH_HOLD_MS);
        return;
      }

      /* Cancela el arrastre nativo de la imagen y la selección de texto, que si no secuestran el
         gesto antes de que llegue a moverse. **Con el dedo no se hace**: ahí `preventDefault` en
         `pointerdown` se lleva por delante el toque que abre la vista grande. */
      event.preventDefault();
    },
    [onMove, activate],
  );

  useEffect(() => {
    if (!onMove) return;

    /** Sobre qué miniatura está el puntero. Se pregunta a las medidas reales, no a un índice. */
    const indexAt = (x: number, y: number): number | null => {
      for (const [index, node] of items.current.entries()) {
        if (!node?.isConnected) continue;

        const rect = node.getBoundingClientRect();

        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          return index;
        }
      }

      return null;
    };

    const move = (event: PointerEvent) => {
      const current = gesture.current;

      if (!current || event.pointerId !== current.pointerId) return;

      const distance = Math.hypot(
        event.clientX - current.x,
        event.clientY - current.y,
      );

      if (!isActive.current) {
        /* Antes de activarse, moverse significa lo contrario en cada entrada: con ratón es la
           señal de que el arrastre empieza; con el dedo es la señal de que la persona está
           desplazando la página, así que el gesto se le devuelve a la página. */
        if (current.pointerType === "touch") {
          if (distance > TOUCH_TOLERANCE_PX) stop();
          return;
        }

        if (distance <= MOUSE_THRESHOLD_PX) return;

        activate(current.index);
        /* Y se sigue, sin `return`: el mismo movimiento que abre el arrastre ya dice sobre cuál se
           está. Cortando aquí, un gesto de ratón con un solo movimiento —soltar en el primer sitio
           al que se llega— terminaba sin destino y no movía nada. */
      }

      const over = indexAt(event.clientX, event.clientY);

      dropTarget.current = over;
      setOverIndex(over);
    };

    const finish = (event: PointerEvent) => {
      const current = gesture.current;

      if (!current || event.pointerId !== current.pointerId) return;

      const from = current.index;
      const to = dropTarget.current;
      const wasDragging = isActive.current;

      stop();

      // Un toque que nunca llegó a arrastrar es un toque: abre la vista grande y no mueve nada.
      if (!wasDragging) return;

      justDragged.current = true;

      // Soltar una miniatura sobre sí misma —o fuera de la bandeja— no es un cambio.
      if (to !== null && to !== from) onMove(from, to);
    };

    const abort = () => stop();
    /* Escape suelta el arrastre donde estaba. Es la salida de quien se arrepintió a medio gesto y
       no encuentra dónde soltar sin cambiar nada. */
    const abortOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop();
    };

    /* En `window` y no en la fila: el dedo se sale de la miniatura en cuanto empieza a moverse, y
       un oyente en el elemento dejaría de enterarse justo cuando hace falta. */
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", abort);
    window.addEventListener("keydown", abortOnEscape);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", abort);
      window.removeEventListener("keydown", abortOnEscape);
    };
  }, [onMove, activate, stop]);

  useEffect(() => {
    if (!list || !onMove) return;

    /* La única forma de que el dedo arrastre sin que la página se desplace debajo. `preventDefault`
       sobre `touchmove` exige un oyente **no pasivo**, y React los registra pasivos, así que este
       se pone a mano. Solo actúa con el arrastre ya activo: antes de eso, deslizar el dedo sobre la
       bandeja tiene que seguir bajando por el formulario como en cualquier otro sitio. */
    const holdThePage = (event: TouchEvent) => {
      if (isActive.current) event.preventDefault();
    };

    list.addEventListener("touchmove", holdThePage, { passive: false });

    return () => list.removeEventListener("touchmove", holdThePage);
  }, [list, onMove]);

  // Al desmontar con un gesto a medias, el temporizador del dedo se quedaría corriendo solo.
  useEffect(() => stop, [stop]);

  const shouldIgnoreClick = useCallback((): boolean => {
    if (!justDragged.current) return false;

    justDragged.current = false;

    return true;
  }, []);

  return {
    registerList: setList,
    registerItem,
    startDrag,
    draggingIndex,
    overIndex,
    shouldIgnoreClick,
  };
}
