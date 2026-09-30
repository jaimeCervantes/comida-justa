"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AnimationScene,
  playheadAt,
  sceneStartMs,
  totalDurationMs,
} from "./playhead";

export type PlaybackStatus = "paused" | "playing" | "finished";

/** Un cuadro del reloj: cuánto va reproducido y si está corriendo. */
export interface ClockFrame {
  elapsedMs: number;
  playing: boolean;
}

/**
 * El pulso del reloj para quien dibuja.
 *
 * Avisa en cada cuadro mientras reproduce, al pausar o reanudar y al saltar de escena. Quien se
 * suscribe recibe el cuadro actual en el momento: una escena que acaba de montarse se dibuja en su
 * instante correcto sin esperar al siguiente cuadro.
 */
export interface ClockFeed {
  subscribe: (listener: (frame: ClockFrame) => void) => () => void;
}

export interface AnimationClock {
  sceneIndex: number;
  beatIndex: number;
  status: PlaybackStatus;
  /** Si alguna vez se reprodujo: decide si el botón invita a ver o a continuar. */
  started: boolean;
  play: () => void;
  pause: () => void;
  goToScene: (sceneIndex: number) => void;
  feed: ClockFeed;
}

interface Position {
  sceneIndex: number;
  beatIndex: number;
}

/**
 * El reloj de una animación: cuánto lleva reproducido y en qué escena y subtítulo va.
 *
 * Hay dos salidas, a dos ritmos. La escena y el subtítulo se publican como estado de React solo
 * cuando cambian, porque de ellos dependen el texto y los controles. El tiempo exacto sale por
 * `feed`, sin pasar por React: las ilustraciones lo necesitan sesenta veces por segundo, y
 * re-renderizar el reproductor a ese ritmo para un texto que cambia cada seis no tiene sentido.
 *
 * Cada cuadro suma lo transcurrido desde el anterior (`performance.now()`), así que una pestaña que
 * vuelve de segundo plano salta hasta donde debía ir en vez de retomar donde se quedó.
 */
export function useAnimationClock(
  scenes: readonly AnimationScene[],
): AnimationClock {
  const elapsedRef = useRef(0);
  const playingRef = useRef(false);
  const listenersRef = useRef(new Set<(frame: ClockFrame) => void>());
  const [position, setPosition] = useState<Position>({
    sceneIndex: 0,
    beatIndex: 0,
  });
  const [status, setStatus] = useState<PlaybackStatus>("paused");
  const [started, setStarted] = useState(false);

  const notify = useCallback(() => {
    const frame: ClockFrame = {
      elapsedMs: elapsedRef.current,
      playing: playingRef.current,
    };
    for (const listener of listenersRef.current) listener(frame);
  }, []);

  const feed = useMemo<ClockFeed>(
    () => ({
      subscribe(listener) {
        listenersRef.current.add(listener);
        listener({
          elapsedMs: elapsedRef.current,
          playing: playingRef.current,
        });
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [],
  );

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
      notify();
      return playhead.finished;
    },
    [scenes, notify],
  );

  useEffect(() => {
    playingRef.current = status === "playing";
    notify();
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
  }, [status, scenes, publish, notify]);

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

  return { ...position, status, started, play, pause, goToScene, feed };
}
