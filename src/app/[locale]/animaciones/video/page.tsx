import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";
import { type AppLocale, resolveLocale } from "~/i18n/routing";
import { PRODUCTION_URL } from "~/infra/constants";
import {
  OVERVIEW_CAPTION_KEYS,
  OVERVIEW_CHIP_KEYS,
  PILLARS_OVERVIEW_SCRIPT,
} from "~/presentation/habits/animations/pillarsOverviewScript";
import {
  FILMS,
  type FilmId,
  isFilmId,
} from "~/presentation/habits/animations/social/films";
import SocialComposition from "~/presentation/habits/animations/social/SocialComposition";
import {
  isSocialCut,
  isSocialFormat,
} from "~/presentation/habits/animations/social/socialCuts";
import { SLEEP_STORY } from "~/presentation/habits/animations/stories/sleepStory";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface FilmTexts {
  captions: string[][];
  chips: string[];
  outroTitle: string;
  siteUrl: string;
}

/** Los textos de cada animación en el idioma de la página, y adónde invita su cierre. */
async function filmTexts(
  filmId: FilmId,
  locale: AppLocale,
): Promise<FilmTexts> {
  const t = await getTranslations({ locale, namespace: "pillarAnimations" });
  const host = new URL(PRODUCTION_URL).host;
  if (filmId === "sueno") {
    const tPages = await getTranslations({ locale, namespace: "pillarPages" });
    return {
      captions: SLEEP_STORY.script.map((scene) =>
        SLEEP_STORY.captionKeys[scene.id].map((key) => String(t.raw(key))),
      ),
      chips: SLEEP_STORY.script.map((scene) =>
        t(SLEEP_STORY.chipKeys[scene.id]),
      ),
      outroTitle: tPages("sleep.heading"),
      siteUrl: `${host}${getPathname({
        locale,
        href: {
          pathname: "/pilares/[[...slug]]",
          params: { slug: [SLEEP_STORY.slug] },
        },
      })}`,
    };
  }
  return {
    captions: PILLARS_OVERVIEW_SCRIPT.map((scene) =>
      OVERVIEW_CAPTION_KEYS[scene.id].map((key) => String(t.raw(key))),
    ),
    chips: PILLARS_OVERVIEW_SCRIPT.map((scene) =>
      t(OVERVIEW_CHIP_KEYS[scene.id]),
    ),
    outroTitle: t("social.outroTitle"),
    siteUrl: `${host}${getPathname({ locale, href: PILLARS_OVERVIEW_HREF })}`,
  };
}

/**
 * El estudio de exportación a video: `?animacion=sueno&pieza=completo&formato=vertical`.
 * `animacion` es `pilares` (la de los cuatro, por omisión) o la de un pilar.
 *
 * **Solo existe en desarrollo** (404 en producción): la abre `scripts/animations/render-video.mjs`
 * con Playwright, que la lleva cuadro por cuadro y captura. La composición cubre la ventana entera
 * por encima del resto del sitio, que sigue montado debajo porque el `<html>` lo pone el layout de
 * idioma.
 */
export default async function AnimationVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    animacion?: string;
    pieza?: string;
    formato?: string;
  }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const {
    animacion = "pilares",
    pieza = "completo",
    formato = "vertical",
  } = await searchParams;
  if (!isFilmId(animacion)) notFound();
  if (!isSocialCut(FILMS[animacion], pieza) || !isSocialFormat(formato)) {
    notFound();
  }

  const texts = await filmTexts(animacion, locale);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black">
      <SocialComposition
        filmId={animacion}
        cut={pieza}
        format={formato}
        captions={texts.captions}
        chips={texts.chips}
        outroTitle={texts.outroTitle}
        siteUrl={texts.siteUrl}
      />
    </div>
  );
}
