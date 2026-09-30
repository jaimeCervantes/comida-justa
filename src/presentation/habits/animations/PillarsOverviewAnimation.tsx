"use client";
import { useLocale, useTranslations } from "next-intl";
import type { AnimationPlacement } from "./animationAnalytics";
import IllustratedAnimation from "./IllustratedAnimation";
import { OVERVIEW_ARTS, OVERVIEW_SCENES } from "./overviewScenes";
import { OVERVIEW_TIMINGS } from "./overviewTimings";
import type { SceneLook } from "./PillarAnimationPlayer";
import {
  OVERVIEW_CAPTION_KEYS,
  OVERVIEW_CHIP_KEYS,
  type OverviewSceneId,
  PILLARS_OVERVIEW_SCRIPT,
} from "./pillarsOverviewScript";

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
  const locale = useLocale();
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

  return (
    <IllustratedAnimation
      animationId={ANIMATION_ID}
      placement={placement}
      script={PILLARS_OVERVIEW_SCRIPT}
      sceneConfigs={PILLARS_OVERVIEW_SCRIPT.map(
        (scene) => OVERVIEW_SCENES[scene.id],
      )}
      timings={OVERVIEW_TIMINGS}
      arts={OVERVIEW_ARTS}
      captions={captions}
      looks={looks}
      regionLabel={t("player.regionLabel")}
      soundtrack={`/animations/pilares/sonido-${locale}.mp3`}
      cta={{ href: practicesHref, label: tInvitation("cta") }}
    />
  );
}
