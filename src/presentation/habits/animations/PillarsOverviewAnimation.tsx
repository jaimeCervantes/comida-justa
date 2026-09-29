"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ComponentType, useEffect, useState } from "react";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import styles from "./PillarAnimation.module.css";
import PillarAnimationPlayer, {
  type PlayerLabels,
  type StageFrame,
} from "./PillarAnimationPlayer";
import {
  OVERVIEW_CAPTION_KEYS,
  type OverviewSceneId,
  PILLARS_OVERVIEW_SCRIPT,
} from "./pillarsOverviewScript";
import ClosingStage from "./scenes/ClosingStage";
import IntroStage from "./scenes/IntroStage";
import MindSpiritStage from "./scenes/MindSpiritStage";
import MovementStage from "./scenes/MovementStage";
import NutritionStage from "./scenes/NutritionStage";
import SleepStage from "./scenes/SleepStage";

const STAGES: Record<OverviewSceneId, ComponentType<{ beat: number }>> = {
  intro: IntroStage,
  sleep: SleepStage,
  nutrition: NutritionStage,
  movement: MovementStage,
  mindSpirit: MindSpiritStage,
  closing: ClosingStage,
};

type LogoPlacement = "hero" | "corner" | null;

/**
 * El logo abre y cierra, y no aparece en medio: los pilares son los protagonistas de su escena.
 * Grande cuando habla la marca (el primer subtítulo, la invitación final); en la esquina mientras
 * el gancho y el templo se cuentan.
 */
function logoPlacement(sceneId: OverviewSceneId, beat: number): LogoPlacement {
  if (sceneId === "intro") return beat <= 0 ? "hero" : "corner";
  if (sceneId === "closing") return beat >= 1 ? "hero" : "corner";
  return null;
}

/**
 * Retrasa un cuadro el primer subtítulo de cada escena: lo que ya está «encendido» al montar no
 * tendría transición, y la escena aparecería de golpe en vez de construirse.
 */
function SceneFrame({ frame }: { frame: StageFrame }) {
  const [entered, setEntered] = useState(frame.steps);
  useEffect(() => {
    if (entered) return;
    const handle = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(handle);
  }, [entered]);

  const sceneId = PILLARS_OVERVIEW_SCRIPT[frame.sceneIndex].id;
  const beat = entered ? frame.beatIndex : -1;
  const Stage = STAGES[sceneId];
  const placement = logoPlacement(sceneId, beat);

  return (
    <>
      <Stage beat={beat} />
      {placement && (
        <Image
          src="/logo.webp"
          alt={PUBLIC_BRAND_NAME}
          width={500}
          height={500}
          data-testid="animation-logo"
          data-placement={placement}
          className={`${styles.logo} h-auto drop-shadow-lg`}
        />
      )}
    </>
  );
}

export default function PillarsOverviewAnimation({
  practicesHref,
}: {
  practicesHref: string;
}) {
  const t = useTranslations("pillarAnimations");
  const tInvitation = useTranslations("habitCommunity.invitation");

  const captions = PILLARS_OVERVIEW_SCRIPT.map((scene) =>
    OVERVIEW_CAPTION_KEYS[scene.id].map((key) => t(key)),
  );
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

  return (
    <PillarAnimationPlayer
      animationId="pillars-overview"
      scenes={PILLARS_OVERVIEW_SCRIPT}
      captions={captions}
      labels={labels}
      renderStage={(frame) => (
        <SceneFrame key={`${frame.sceneIndex}`} frame={frame} />
      )}
      finale={
        <a
          href={practicesHref}
          data-testid="animation-cta"
          className={`${buttonVariants({ color: "orange", size: "lg" })} self-start`}
        >
          {tInvitation("cta")}
        </a>
      }
    />
  );
}
