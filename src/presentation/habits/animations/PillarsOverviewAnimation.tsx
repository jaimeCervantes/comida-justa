"use client";
import { useTranslations } from "next-intl";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { type AnimationPlacement, trackAnimation } from "./animationAnalytics";
import { OVERVIEW_ARTS, OVERVIEW_SCENES } from "./overviewScenes";
import { OVERVIEW_TIMINGS } from "./overviewTimings";
import PillarAnimationPlayer, {
  type PlayerEvent,
  type PlayerLabels,
  type SceneLook,
} from "./PillarAnimationPlayer";
import {
  OVERVIEW_CAPTION_KEYS,
  OVERVIEW_CHIP_KEYS,
  type OverviewSceneId,
  PILLARS_OVERVIEW_SCRIPT,
} from "./pillarsOverviewScript";
import { ART_SIZES, artSources } from "./scenes/artSources";
import IllustratedScene from "./scenes/IllustratedScene";

/**
 * El acento de cada escena fuera del escenario. El subrayado usa los tokens del tema (se lee en
 * claro y en oscuro); el resplandor, los colores fijos del cuadro. El gancho y el cierre no son de
 * ningún pilar y toman las dos tintas de la marca —el naranja y el verde—, que son las mismas de
 * Alimentación y Movimiento y ya tienen su contraste verificado en los dos temas.
 */
const LOOKS: Record<OverviewSceneId, Omit<SceneLook, "chip">> = {
  intro: {
    accentInk: "var(--color-pillar-nutrition-ink)",
    accentSoft: "var(--color-brand-honey-soft)",
    glow: ["#7c3aed", "#f97316", "#f43f5e"],
  },
  sleep: {
    accentInk: "var(--color-pillar-sleep-ink)",
    accentSoft: "var(--color-pillar-sleep-soft)",
    glow: ["#7c3aed", "#f472b6", "#312e81"],
  },
  nutrition: {
    accentInk: "var(--color-pillar-nutrition-ink)",
    accentSoft: "var(--color-pillar-nutrition-soft)",
    glow: ["#f97316", "#84cc16", "#facc15"],
  },
  movement: {
    accentInk: "var(--color-pillar-movement-ink)",
    accentSoft: "var(--color-pillar-movement-soft)",
    glow: ["#22c55e", "#0ea5e9", "#facc15"],
  },
  mindSpirit: {
    accentInk: "var(--color-pillar-mind-spirit-ink)",
    accentSoft: "var(--color-pillar-mind-spirit-soft)",
    glow: ["#0ea5e9", "#6366f1", "#14b8a6"],
  },
  closing: {
    accentInk: "var(--color-pillar-movement-ink)",
    accentSoft: "var(--color-brand-green-soft)",
    glow: ["#f0380e", "#7c3aed", "#22c55e"],
  },
};

const ANIMATION_ID = "pillars-overview";

export default function PillarsOverviewAnimation({
  practicesHref,
  placement = "page",
}: {
  practicesHref: string;
  /** Dónde se ve: en `/pilares` o abierta desde la invitación de otra página. Va en cada evento. */
  placement?: AnimationPlacement;
}) {
  const t = useTranslations("pillarAnimations");
  const tInvitation = useTranslations("habitCommunity.invitation");

  /* `t.raw` y no `t`: el subtítulo trae su frase clave marcada con `<hl>`, y la marca la interpreta
     el subtítulo cinético, no el formateador de mensajes. */
  const captions = PILLARS_OVERVIEW_SCRIPT.map((scene) =>
    OVERVIEW_CAPTION_KEYS[scene.id].map((key) => String(t.raw(key))),
  );
  const looks: SceneLook[] = PILLARS_OVERVIEW_SCRIPT.map((scene) => ({
    ...LOOKS[scene.id],
    chip: t(OVERVIEW_CHIP_KEYS[scene.id]),
  }));
  const labels: PlayerLabels = {
    regionLabel: t("player.regionLabel"),
    play: t("player.play"),
    pause: t("player.pause"),
    resume: t("player.resume"),
    replay: t("player.replay"),
    previous: t("player.previous"),
    next: t("player.next"),
    sceneOf: (current, total) => t("player.sceneOf", { current, total }),
    goToScene: (number) => t("player.goToScene", { number }),
    stepsNote: t("player.stepsNote"),
  };

  const measure = (event: PlayerEvent) => {
    if (event.type === "play") {
      trackAnimation(ANIMATION_ID, "animation_play", placement, {
        trigger: event.trigger,
      });
    } else if (event.type === "scene") {
      trackAnimation(ANIMATION_ID, "animation_scene", placement, {
        scene: event.scene,
      });
    } else {
      trackAnimation(ANIMATION_ID, "animation_complete", placement);
    }
  };

  return (
    <PillarAnimationPlayer
      animationId={ANIMATION_ID}
      onEvent={measure}
      scenes={PILLARS_OVERVIEW_SCRIPT}
      captions={captions}
      looks={looks}
      labels={labels}
      renderScene={({ sceneIndex, active, steps, feed }) => {
        const scene = OVERVIEW_SCENES[PILLARS_OVERVIEW_SCRIPT[sceneIndex].id];
        return (
          <IllustratedScene
            beats={scene.beats}
            logo={scene.logo}
            timing={OVERVIEW_TIMINGS[sceneIndex]}
            active={active}
            steps={steps}
            feed={feed}
          />
        );
      }}
      preload={OVERVIEW_ARTS.map((art) => {
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
          href={practicesHref}
          data-testid="animation-cta"
          onClick={() =>
            trackAnimation(ANIMATION_ID, "animation_cta", placement)
          }
          className={`${buttonVariants({ color: "orange", size: "lg" })} self-start`}
        >
          {tInvitation("cta")}
        </a>
      }
    />
  );
}
