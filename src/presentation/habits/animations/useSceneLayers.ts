"use client";
import { useEffect, useState } from "react";

/** Lo que dura la escena saliente debajo de la nueva: lo justo para que la entrada la tape. */
const OUTGOING_MS = 1100;

/**
 * Las escenas que hay que tener montadas: la actual y, durante un momento, la que se va.
 *
 * Sin la saliente, cada cambio de escena sería un corte a fondo vacío antes de que la nueva se
 * construya. Con ella, la nueva entra **sobre** la anterior, que se queda quieta en su último
 * cuadro. Con movimiento reducido no hay entradas, así que basta la actual.
 */
export function useSceneLayers(current: number, steps: boolean): number[] {
  const [layers, setLayers] = useState<number[]>([current]);
  const [tracked, setTracked] = useState(current);

  if (tracked !== current) {
    setTracked(current);
    setLayers((previous) => [previous[previous.length - 1], current]);
  }

  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(
      () => setLayers((all) => all.slice(-1)),
      OUTGOING_MS,
    );
    return () => clearTimeout(timer);
  }, [layers]);

  return steps ? [current] : layers;
}
