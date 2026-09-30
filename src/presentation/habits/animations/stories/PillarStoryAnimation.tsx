"use client";
import { useLocale, useTranslations } from "next-intl";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import IllustratedAnimation from "../IllustratedAnimation";
import type { SceneLook } from "../PillarAnimationPlayer";
import { PILLAR_STORIES } from "./pillarStories";
import { storyArts, storyTimings } from "./pillarStory";

/**
 * La animación propia de un pilar, bajo el héroe de su página. Si el pilar todavía no tiene la
 * suya, no se pinta nada.
 *
 * Arranca sola la primera vez que se abre **esa** página y su final lleva a la práctica del pilar,
 * que está más abajo en la misma página.
 */
export default function PillarStoryAnimation({
  pillar,
  practiceHref,
}: {
  pillar: PillarKey;
  practiceHref: string;
}) {
  const t = useTranslations("pillarAnimations");
  const tPages = useTranslations("pillarPages");
  const locale = useLocale();
  const story = PILLAR_STORIES[pillar];
  if (!story) return null;

  /* `t.raw` y no `t`: el subtítulo trae su frase clave marcada con `<hl>`, y la marca la interpreta
     el subtítulo cinético, no el formateador de mensajes. */
  const captions = story.script.map((scene) =>
    story.captionKeys[scene.id].map((key) => String(t.raw(key))),
  );
  const looks: SceneLook[] = story.script.map((scene) => ({
    ...story.looks[scene.id],
    chip: t(story.chipKeys[scene.id]),
  }));

  return (
    <IllustratedAnimation
      animationId={story.animationId}
      placement="page"
      script={story.script}
      sceneConfigs={story.script.map((scene) => story.scenes[scene.id])}
      timings={storyTimings(story)}
      arts={storyArts(story)}
      captions={captions}
      looks={looks}
      regionLabel={t(story.regionLabelKey)}
      soundtrack={
        story.soundtrackBase
          ? `${story.soundtrackBase}-${locale}.mp3`
          : undefined
      }
      cta={{ href: practiceHref, label: tPages("heroPracticeCta") }}
    />
  );
}
