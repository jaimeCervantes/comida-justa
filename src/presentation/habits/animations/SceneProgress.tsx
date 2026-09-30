"use client";
import { useEffect, useRef } from "react";
import { type AnimationScene, playheadAt } from "./playhead";
import type { ClockFeed } from "./useAnimationClock";

/**
 * La barra de progreso por escenas, al estilo de las historias: una pista por escena, que se llena
 * mientras se reproduce. Cada pista es también el botón para ir a esa escena.
 *
 * El relleno se escribe directo en el DOM en cada cuadro del reloj, sin pasar por React: son seis
 * transformaciones, no merece la pena re-renderizar el reproductor para eso.
 */
export default function SceneProgress({
  scenes,
  feed,
  current,
  steps,
  labelFor,
  onSelect,
}: {
  scenes: readonly AnimationScene[];
  feed: ClockFeed;
  current: number;
  steps: boolean;
  labelFor: (sceneNumber: number) => string;
  onSelect: (sceneIndex: number) => void;
}) {
  const fillsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(
    () =>
      feed.subscribe(({ elapsedMs }) => {
        const playhead = playheadAt(scenes, elapsedMs);
        fillsRef.current.forEach((fill, index) => {
          if (!fill) return;
          const amount =
            index < playhead.sceneIndex
              ? 1
              : index > playhead.sceneIndex
                ? 0
                : steps
                  ? 1
                  : playhead.sceneProgress;
          fill.style.transform = `scaleX(${amount})`;
        });
      }),
    [feed, scenes, steps],
  );

  return (
    <ol className="absolute inset-x-3 top-1.5 z-10 flex gap-1.5 sm:inset-x-4">
      {scenes.map((scene, index) => (
        <li key={scene.id} className="flex-1">
          <button
            type="button"
            aria-label={labelFor(index + 1)}
            aria-current={index === current ? "step" : undefined}
            onClick={() => onSelect(index)}
            className="focus-ring block w-full rounded-full py-2.5"
          >
            <span className="block h-1 overflow-hidden rounded-full bg-white/30">
              <span
                ref={(fill) => {
                  fillsRef.current[index] = fill;
                }}
                className="block h-full origin-left rounded-full bg-white"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
