"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AnimationScene,
  playheadAt,
  sceneStartMs,
  totalDurationMs,
} from "./playhead";

export type PlaybackStatus = "paused" | "playing" | "finished";

export interface AnimationClock {
  sceneIndex: number;
  beatIndex: number;
  status: PlaybackStatus;
  /** Si alguna vez se reprodujo: decide si el botón invita a ver o a continuar. */
  started: boolean;
  play: () => void;
  pause: () => void;
  goToScene: (sceneIndex: number) => void;
}

interface Position {
  sceneIndex: number;
  beatIndex: number;
}

/**
 * El reloj de una animación: cuánto lleva reproducido y en qué escena y subtítulo va.
 *
 * El tiempo transcurrido vive en una ref y solo se publica como estado cuando cambia la escena o el
 * subtítulo. Publicarlo en cada cuadro re-renderizaría el reproductor sesenta veces por segundo
 * para un texto que cambia cada seis. Las ilustraciones se mueven con CSS, no con este reloj.
 *
 * Cada cuadro suma lo transcurrido desde el anterior (`performance.now()`), así que una pestaña que
 * vuelve de segundo plano salta hasta donde debía ir en vez de retomar donde se quedó.
 */
export function useAnimationClock(
  scenes: readonly AnimationScene[],
): AnimationClock {
  const elapsedRef = useRef(0);
  const [position, setPosition] = useState<Position>({
    sceneIndex: 0,
    beatIndex: 0,
  });
  const [status, setStatus] = useState<PlaybackStatus>("paused");
  const [started, setStarted] = useState(false);

  const publish = useCallback(
    (elapsedMs: number): boolean => {
      elapsedRef.current = elapsedMs;
      const playhead = playheadAt(scenes, elapsedMs);
      setPosition((current) =>
        current.sceneIndex === playhead.sceneIndex &&
        current.beatIndex === playhead.beatIndex
          ? current
          : { sceneIndex: playhead.sceneIndex, beatIndex: playhead.beatIndex },
      );
      return playhead.finished;
    },
    [scenes],
  );

  useEffect(() => {
    if (status !== "playing") return;
    const total = totalDurationMs(scenes);
    let last = performance.now();
    let frame = requestAnimationFrame(function tick() {
      const now = performance.now();
      const next = Math.min(elapsedRef.current + (now - last), total);
      last = now;
      if (publish(next)) {
        setStatus("finished");
        return;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [status, scenes, publish]);

  const play = useCallback(() => {
    if (status === "finished") publish(0);
    setStarted(true);
    setStatus("playing");
  }, [status, publish]);

  const pause = useCallback(() => {
    setStatus((current) => (current === "playing" ? "paused" : current));
  }, []);

  const goToScene = useCallback(
    (sceneIndex: number) => {
      const bounded = Math.min(Math.max(sceneIndex, 0), scenes.length - 1);
      publish(sceneStartMs(scenes, bounded));
      setStatus((current) => (current === "finished" ? "paused" : current));
    },
    [scenes, publish],
  );

  return { ...position, status, started, play, pause, goToScene };
}
