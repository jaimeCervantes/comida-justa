"use client";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdPause,
  MdPlayArrow,
  MdReplay,
} from "react-icons/md";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import KineticCaption from "./KineticCaption";
import styles from "./PillarAnimation.module.css";
import type { AnimationScene } from "./playhead";
import SceneProgress from "./SceneProgress";
import { markAnimationSeen } from "./seenAnimations";
import { type ClockFeed, useAnimationClock } from "./useAnimationClock";
import {
  useHasSeenAnimation,
  usePrefersReducedMotion,
} from "./usePlaybackPreferences";
import { useSceneLayers } from "./useSceneLayers";

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

/** Cómo se viste cada escena fuera del escenario: su etiqueta, su acento y su resplandor. */
export interface SceneLook {
  /** Etiqueta breve sobre el escenario: «Pilar 1 · Sueño». */
  chip: string;
  /** Tinta y fondo del subrayado del subtítulo; variables CSS del tema, para claro y oscuro. */
  accentInk: string;
  accentSoft: string;
  /** Tres colores del resplandor ambiental, fijos como el escenario. */
  glow: readonly [string, string, string];
}

export interface SceneRenderProps {
  sceneIndex: number;
  active: boolean;
  steps: boolean;
  feed: ClockFeed;
}

interface PillarAnimationPlayerProps {
  animationId: string;
  scenes: readonly AnimationScene[];
  /** Los subtítulos de cada escena, con su frase clave entre `<hl>` y `</hl>`. */
  captions: readonly (readonly string[])[];
  looks: readonly SceneLook[];
  labels: PlayerLabels;
  renderScene: (props: SceneRenderProps) => ReactNode;
  /** Lo que se ofrece en la última escena (la invitación a practicar). */
  finale?: ReactNode;
  /**
   * Lo que conviene descargar en cuanto empieza a reproducirse (las ilustraciones de las escenas
   * siguientes), para que ninguna aparezca a medio cargar. Se monta oculto y solo tras arrancar:
   * quien nunca le da a reproducir no descarga nada de más.
   */
  preload?: ReactNode;
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
  looks,
  labels,
  renderScene,
  finale,
  preload,
}: PillarAnimationPlayerProps) {
  const clock = useAnimationClock(scenes);
  const seen = useHasSeenAnimation(animationId);
  const steps = usePrefersReducedMotion();
  const layers = useSceneLayers(clock.sceneIndex, steps);
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
  const look = looks[clock.sceneIndex];
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
      className="flex flex-col gap-5"
    >
      <div className="relative isolate">
        {/* El resplandor: los colores de la escena derramados alrededor, como una luz ambiente. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-4 -z-10 opacity-60 blur-3xl sm:-inset-8"
        >
          <div
            className={`${styles.ambient} absolute top-[6%] left-[2%] h-3/4 w-1/2 rounded-full`}
            style={{ backgroundColor: look.glow[0] }}
          />
          <div
            className={`${styles.ambient} absolute top-[18%] right-[2%] h-3/4 w-1/2 rounded-full`}
            style={{ backgroundColor: look.glow[1] }}
          />
          <div
            className={`${styles.ambient} absolute bottom-0 left-1/4 h-1/2 w-1/2 rounded-full`}
            style={{ backgroundColor: look.glow[2] }}
          />
        </div>

        <div className="relative isolate aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-2xl ring-1 ring-black/10 sm:aspect-video">
          {layers.map((index) => (
            <div key={scenes[index].id} className="absolute inset-0">
              {renderScene({
                sceneIndex: index,
                active: index === clock.sceneIndex,
                steps,
                feed: clock.feed,
              })}
            </div>
          ))}
          <div className={styles.vignette} />
          <div className={styles.grain} />
          <div className={styles.topScrim} />
          <SceneProgress
            scenes={scenes}
            feed={clock.feed}
            current={clock.sceneIndex}
            steps={steps}
            labelFor={labels.goToScene}
            onSelect={clock.goToScene}
          />
          <span
            key={scene.id}
            className="absolute top-8 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md sm:left-4"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: look.glow[0] }}
            />
            {look.chip}
          </span>
        </div>
      </div>

      <div
        data-testid="animation-caption"
        aria-live={playing ? "off" : "polite"}
        style={
          {
            "--accent-ink": look.accentInk,
            "--accent-soft": look.accentSoft,
          } as CSSProperties
        }
        className="min-h-[7.5rem] text-[1.35rem] leading-snug font-medium tracking-tight text-balance text-text-base sm:min-h-[6.5rem] sm:text-2xl lg:text-[1.7rem]"
      >
        {steps ? (
          sceneCaptions.map((markup) => (
            <div key={markup} className="mb-3 last:mb-0">
              <KineticCaption markup={markup} still />
            </div>
          ))
        ) : (
          <KineticCaption
            key={`${clock.sceneIndex}-${beatIndex}`}
            markup={sceneCaptions[beatIndex] ?? ""}
          />
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
              color: "white",
              size: "md",
              iconOnly: true,
            })}
          >
            <MdChevronLeft aria-hidden className="size-7 shrink-0" />
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
              color: "white",
              size: "md",
              iconOnly: true,
            })}
          >
            <MdChevronRight aria-hidden className="size-7 shrink-0" />
          </button>
        </div>
        <span className="text-sm text-text-muted tabular-nums">
          {labels.sceneOf(clock.sceneIndex + 1, scenes.length)}
        </span>
      </div>

      {steps && <p className="text-sm text-text-muted">{labels.stepsNote}</p>}
      {clock.started && preload && (
        <div hidden aria-hidden="true">
          {preload}
        </div>
      )}
    </section>
  );
}
