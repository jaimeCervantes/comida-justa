"use client";
import { useTranslations } from "next-intl";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { type AnimationPlacement, trackAnimation } from "./animationAnalytics";
import PillarAnimationPlayer, {
  type PlayerEvent,
  type PlayerLabels,
  type SceneLook,
} from "./PillarAnimationPlayer";
import type { AnimationScene } from "./playhead";
import { ART_SIZES, artSources } from "./scenes/artSources";
import IllustratedScene, {
  type IllustratedSceneConfig,
} from "./scenes/IllustratedScene";
import type { SceneTiming } from "./scenes/useSceneTimeline";

export interface IllustratedAnimationProps {
  /** El de «ya la vi» y el de la medición: `pillars-overview`, `pillar-sleep`. */
  animationId: string;
  /** Dónde se ve: en su página o abierta desde la invitación de otra. Va en cada evento. */
  placement: AnimationPlacement;
  script: readonly AnimationScene[];
  /** Lo que se ve en cada escena del guion, en su mismo orden. */
  sceneConfigs: readonly IllustratedSceneConfig[];
  timings: readonly SceneTiming[];
  /** Todas las ilustraciones, en orden de aparición, para precargarlas. */
  arts: readonly string[];
  /** Los subtítulos de cada escena, con su frase clave marcada con `<hl>`. */
  captions: readonly (readonly string[])[];
  looks: readonly SceneLook[];
  regionLabel: string;
  soundtrack?: string;
  /** La invitación del final: a qué práctica lleva y con qué texto. */
  cta: { href: string; label: string };
}

/**
 * Una animación ilustrada completa: el reproductor, sus escenas, la precarga, la medición y la
 * invitación del final. Lo que cambia de una animación a otra —el guion, las ilustraciones, los
 * textos, adónde lleva— entra por propiedades; los controles y su medición son siempre los mismos.
 */
export default function IllustratedAnimation({
  animationId,
  placement,
  script,
  sceneConfigs,
  timings,
  arts,
  captions,
  looks,
  regionLabel,
  soundtrack,
  cta,
}: IllustratedAnimationProps) {
  const t = useTranslations("pillarAnimations.player");

  const labels: PlayerLabels = {
    regionLabel,
    play: t("play"),
    pause: t("pause"),
    resume: t("resume"),
    replay: t("replay"),
    previous: t("previous"),
    next: t("next"),
    sceneOf: (current, total) => t("sceneOf", { current, total }),
    goToScene: (number) => t("goToScene", { number }),
    stepsNote: t("stepsNote"),
    soundOn: t("soundOn"),
    soundOff: t("soundOff"),
  };

  const measure = (event: PlayerEvent) => {
    if (event.type === "play") {
      trackAnimation(animationId, "animation_play", placement, {
        trigger: event.trigger,
      });
    } else if (event.type === "scene") {
      trackAnimation(animationId, "animation_scene", placement, {
        scene: event.scene,
      });
    } else if (event.type === "sound") {
      trackAnimation(animationId, "animation_sound", placement, {
        state: event.on ? "on" : "off",
      });
    } else {
      trackAnimation(animationId, "animation_complete", placement);
    }
  };

  return (
    <PillarAnimationPlayer
      animationId={animationId}
      onEvent={measure}
      soundtrack={soundtrack}
      scenes={script}
      captions={captions}
      looks={looks}
      labels={labels}
      renderScene={({ sceneIndex, active, steps, feed }) => {
        const scene = sceneConfigs[sceneIndex];
        return (
          <IllustratedScene
            beats={scene.beats}
            logo={scene.logo}
            timing={timings[sceneIndex]}
            active={active}
            steps={steps}
            feed={feed}
          />
        );
      }}
      preload={arts.map((art) => {
        const sources = artSources(art);
        return (
          // biome-ignore lint/performance/noImgElement: precarga con el mismo srcSet que usará la escena, para que el navegador elija y guarde el mismo archivo.
          <img
            key={art}
            src={sources.src}
            srcSet={sources.srcSet}
            sizes={ART_SIZES}
            alt=""
            loading="eager"
          />
        );
      })}
      finale={
        <a
          href={cta.href}
          data-testid="animation-cta"
          onClick={() =>
            trackAnimation(animationId, "animation_cta", placement)
          }
          className={`${buttonVariants({ color: "orange", size: "lg" })} self-start`}
        >
          {cta.label}
        </a>
      }
    />
  );
}
