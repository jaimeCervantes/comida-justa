"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { type RefObject, useEffect, useRef } from "react";
import type { ClockFeed } from "../useAnimationClock";

gsap.registerPlugin(useGSAP, MorphSVGPlugin, MotionPathPlugin);

/**
 * El instante en que se detiene una escena que todavía no se reproduce.
 *
 * El segundo cero de cada escena es su escenario vacío, a punto de construirse: bueno para ver
 * cómo aparece, malo como imagen fija. Quien vuelve a la página, o salta de escena en pausa, ve
 * este fotograma ya armado; al darle a reproducir, la escena arranca desde el principio.
 */
const POSTER_SEC = 2.2;

/** Cuándo empieza una escena y cuándo cada uno de sus subtítulos, según el guion. */
export interface SceneTiming {
  startMs: number;
  /** Segundos, relativos a la escena, en que empieza cada subtítulo: `[0, 6.25, 15.25]`. */
  beatsSec: readonly number[];
  durationSec: number;
}

export interface SceneProps {
  timing: SceneTiming;
  /** La escena en curso sigue al reloj; la saliente se queda quieta mientras la tapa la nueva. */
  active: boolean;
  /** Movimiento reducido: la escena se muestra ya completa y no se mueve. */
  steps: boolean;
  feed: ClockFeed;
}

export interface SceneBuilder {
  tl: gsap.core.Timeline;
  /** Busca dentro de la escena, nunca en la página: dos reproductores no se pisan. */
  q: (selector: string) => Element[];
  /** El segundo en que empieza el subtítulo `index` (desde 0), más un desfase. */
  beat: (index: number, offset?: number) => number;
  duration: number;
  /** Un vaivén continuo entre `from` y `until` (por omisión, la escena entera). */
  loop: (
    targets: gsap.TweenTarget,
    vars: gsap.TweenVars,
    periodSec: number,
    from?: number,
    until?: number,
  ) => void;
}

/**
 * Construye la línea de tiempo de una escena y la deja **en manos del reloj**.
 *
 * La línea nunca corre sola: está pausada, y en cada cuadro el reloj le dice en qué segundo tiene
 * que estar (`seek`). Eso es lo que hace que pausar congele todo —también la llama o las
 * estrellas—, que saltar de escena sea exacto y que la misma escena pueda exportarse a video
 * cuadro por cuadro: el dibujo es una función del tiempo, igual que el guion.
 */
export function useSceneTimeline(
  scope: RefObject<SVGSVGElement | null>,
  { timing, active, steps, feed }: SceneProps,
  build: (builder: SceneBuilder) => void,
): void {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.9, ease: "power3.out" },
      });
      build({
        tl,
        q: gsap.utils.selector(scope),
        beat: (index, offset = 0) => (timing.beatsSec[index] ?? 0) + offset,
        duration: timing.durationSec,
        loop(targets, vars, periodSec, from = 0, until = timing.durationSec) {
          const repeat = Math.max(0, Math.ceil((until - from) / periodSec) - 1);
          tl.to(
            targets,
            {
              ease: "sine.inOut",
              ...vars,
              duration: periodSec,
              repeat,
              yoyo: true,
            },
            from,
          );
        },
      });
      timelineRef.current = tl;
    },
    { scope },
  );

  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    if (steps) {
      tl.seek(timing.durationSec);
      return;
    }
    if (!active) return;
    return feed.subscribe(({ elapsedMs, playing }) => {
      const sceneMs = elapsedMs - timing.startMs;
      const seconds =
        !playing && sceneMs <= 0 ? POSTER_SEC : Math.max(sceneMs, 0) / 1000;
      tl.seek(Math.min(seconds, timing.durationSec));
    });
  }, [active, steps, feed, timing]);
}
