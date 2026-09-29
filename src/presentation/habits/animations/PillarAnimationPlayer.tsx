"use client";
import { type ReactNode, useEffect, useRef } from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdPause,
  MdPlayArrow,
  MdReplay,
} from "react-icons/md";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import styles from "./PillarAnimation.module.css";
import type { AnimationScene } from "./playhead";
import { markAnimationSeen } from "./seenAnimations";
import { useAnimationClock } from "./useAnimationClock";
import {
  useHasSeenAnimation,
  usePrefersReducedMotion,
} from "./usePlaybackPreferences";

export interface PlayerLabels {
  regionLabel: string;
  play: string;
  pause: string;
  resume: string;
  replay: string;
  previous: string;
  next: string;
  /** Ya con los números puestos, p. ej. «Escena 2 de 6». */
  sceneOf: (current: number, total: number) => string;
  goToScene: (number: number) => string;
  stepsNote: string;
}

export interface StageFrame {
  sceneIndex: number;
  beatIndex: number;
  /** Movimiento reducido: la escena se muestra ya completa y quieta. */
  steps: boolean;
}

interface PillarAnimationPlayerProps {
  animationId: string;
  scenes: readonly AnimationScene[];
  /** Los subtítulos de cada escena, en el orden en que se dicen. */
  captions: readonly (readonly string[])[];
  labels: PlayerLabels;
  renderStage: (frame: StageFrame) => ReactNode;
  /** Lo que se ofrece en la última escena (la invitación a practicar). */
  finale?: ReactNode;
}

/**
 * Reproductor de una animación explicativa: escenario ilustrado, subtítulo y controles.
 *
 * **Nunca tapa la página.** Arranca solo la primera vez que este navegador lo ve, y solo cuando
 * está a la vista: debajo del héroe, en un teléfono, arrancar al cargar sería reproducirlo para
 * nadie. Después queda quieto con su botón.
 *
 * Con movimiento reducido no arranca nunca y cada escena se lee completa, avanzando a mano.
 */
export default function PillarAnimationPlayer({
  animationId,
  scenes,
  captions,
  labels,
  renderStage,
  finale,
}: PillarAnimationPlayerProps) {
  const clock = useAnimationClock(scenes);
  const seen = useHasSeenAnimation(animationId);
  const steps = usePrefersReducedMotion();
  const regionRef = useRef<HTMLElement>(null);
  const { play } = clock;

  useEffect(() => {
    if (seen || steps) return;
    const region = regionRef.current;
    if (!region) return;
    const start = () => {
      markAnimationSeen(animationId);
      play();
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        start();
      },
      { threshold: 0.5 },
    );
    observer.observe(region);
    return () => observer.disconnect();
  }, [seen, steps, animationId, play]);

  const scene = scenes[clock.sceneIndex];
  const sceneCaptions = captions[clock.sceneIndex] ?? [];
  const beatIndex = steps
    ? Math.max(scene.beatDurationsMs.length - 1, 0)
    : clock.beatIndex;
  const isLastScene = clock.sceneIndex === scenes.length - 1;
  const playing = clock.status === "playing";

  const toggleLabel = playing
    ? labels.pause
    : clock.status === "finished"
      ? labels.replay
      : clock.started
        ? labels.resume
        : labels.play;
  const ToggleIcon = playing
    ? MdPause
    : clock.status === "finished"
      ? MdReplay
      : MdPlayArrow;

  return (
    <section
      ref={regionRef}
      aria-label={labels.regionLabel}
      data-testid="pillars-animation"
      data-state={steps ? "paused" : clock.status}
      data-mode={steps ? "steps" : "motion"}
      data-scene={clock.sceneIndex + 1}
      data-total-scenes={scenes.length}
      data-beat={beatIndex + 1}
      data-pillar={scene.pillar ?? "none"}
      className="flex flex-col gap-4"
    >
      <div
        className={`${styles.stage} relative aspect-video w-full overflow-hidden rounded-card shadow-md`}
        data-paused={!playing}
        data-steps={steps}
      >
        {/* La llave remonta la escena al cambiar: cada una entra con su fundido. */}
        <div key={scene.id} className={`${styles.sceneEnter} absolute inset-0`}>
          {renderStage({ sceneIndex: clock.sceneIndex, beatIndex, steps })}
        </div>
      </div>

      <div
        data-testid="animation-caption"
        aria-live={playing ? "off" : "polite"}
        className="min-h-24 text-lg sm:text-xl leading-relaxed text-text-base text-balance"
      >
        {steps ? (
          sceneCaptions.map((caption) => (
            <p key={caption} className="mb-2 last:mb-0">
              {caption}
            </p>
          ))
        ) : (
          <p
            key={`${clock.sceneIndex}-${beatIndex}`}
            className={styles.captionEnter}
          >
            {sceneCaptions[beatIndex]}
          </p>
        )}
      </div>

      {isLastScene && finale}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="animation-previous"
            aria-label={labels.previous}
            disabled={clock.sceneIndex === 0}
            onClick={() => clock.goToScene(clock.sceneIndex - 1)}
            className={buttonVariants({
              color: "default",
              size: "md",
              iconOnly: true,
            })}
          >
            <MdChevronLeft aria-hidden className="size-8 shrink-0" />
          </button>
          {!steps && (
            <button
              type="button"
              data-testid="animation-play-toggle"
              onClick={playing ? clock.pause : clock.play}
              className={buttonVariants({ color: "green", size: "md" })}
            >
              <ToggleIcon aria-hidden className="mr-2 size-6 shrink-0" />
              {toggleLabel}
            </button>
          )}
          <button
            type="button"
            data-testid="animation-next"
            aria-label={labels.next}
            disabled={isLastScene}
            onClick={() => clock.goToScene(clock.sceneIndex + 1)}
            className={buttonVariants({
              color: "default",
              size: "md",
              iconOnly: true,
            })}
          >
            <MdChevronRight aria-hidden className="size-8 shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ol className="flex items-center gap-1">
            {scenes.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-label={labels.goToScene(index + 1)}
                  aria-current={index === clock.sceneIndex ? "step" : undefined}
                  onClick={() => clock.goToScene(index)}
                  className="focus-ring flex h-8 w-6 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden
                    className={`block h-2.5 rounded-full transition-all ${
                      index === clock.sceneIndex
                        ? "w-5 bg-text-base"
                        : "w-2.5 bg-text-muted/40"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ol>
          <span className="text-sm text-text-muted tabular-nums">
            {labels.sceneOf(clock.sceneIndex + 1, scenes.length)}
          </span>
        </div>
      </div>

      {steps && <p className="text-sm text-text-muted">{labels.stepsNote}</p>}
    </section>
  );
}
