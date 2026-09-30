"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { OVERVIEW_SCENES } from "../overviewScenes";
import { OVERVIEW_TIMINGS } from "../overviewTimings";
import {
  type OverviewSceneId,
  PILLARS_OVERVIEW_SCRIPT,
} from "../pillarsOverviewScript";
import { playheadAt } from "../playhead";
import { artSources } from "../scenes/artSources";
import IllustratedScene from "../scenes/IllustratedScene";
import type { ClockFeed, ClockFrame } from "../useAnimationClock";
import { captionAt, easeOut, type FrameSegment } from "./captionFrame";
import {
  type CutBeat,
  type CutRange,
  cutBeats,
  cutRange,
  SOCIAL_FORMATS,
  type SocialCut,
  type SocialFormat,
} from "./socialCuts";

/** El color de cada escena en el video: el de su pilar; el gancho y el cierre, los de la marca. */
const SCENE_ACCENTS: Record<OverviewSceneId, string> = {
  intro: "#fb923c",
  sleep: "#a78bfa",
  nutrition: "#fb923c",
  movement: "#4ade80",
  mindSpirit: "#38bdf8",
  closing: "#4ade80",
};

/** Lo que dura la escena saliente debajo de la entrante, igual que en el reproductor de la web. */
const OUTGOING_MS = 1100;
const BACKDROP_FADE_MS = 1000;
const OUTRO_FADE_MS = 700;

interface Layout {
  header: {
    top: number;
    left: number;
    right: number;
    logo: number;
    chip: number;
  };
  stage: {
    top: number;
    left: number;
    width: number;
    height: number;
    radius: number;
  };
  caption: {
    top?: number;
    bottom?: number;
    left: number;
    right: number;
    size: number;
  };
  footer: { bottom: number; size: number };
}

/**
 * Cómo se reparte cada formato. En vertical y cuadrado el escenario 16:9 queda como una ventana
 * sobre su propia ilustración desenfocada, con el subtítulo grande debajo; en horizontal ocupa todo
 * el cuadro y el subtítulo va en el tercio inferior.
 */
const LAYOUTS: Record<SocialFormat, Layout> = {
  vertical: {
    header: { top: 96, left: 64, right: 64, logo: 104, chip: 30 },
    stage: { top: 380, left: 36, width: 1008, height: 567, radius: 44 },
    caption: { top: 1010, left: 72, right: 72, size: 62 },
    footer: { bottom: 110, size: 34 },
  },
  cuadrado: {
    header: { top: 40, left: 48, right: 48, logo: 72, chip: 24 },
    stage: { top: 140, left: 60, width: 960, height: 540, radius: 36 },
    caption: { top: 716, left: 64, right: 64, size: 38 },
    footer: { bottom: 34, size: 24 },
  },
  horizontal: {
    header: { top: 48, left: 64, right: 64, logo: 96, chip: 28 },
    stage: { top: 0, left: 0, width: 1920, height: 1080, radius: 0 },
    caption: { bottom: 150, left: 140, right: 140, size: 52 },
    footer: { bottom: 56, size: 28 },
  },
};

/**
 * Lo que necesita quien graba. El sonido se arma fuera, con `ffmpeg`: la narración de cada
 * subtítulo va en su `startMs`, y la música se toma de la ventana `fromMs` de la pieza entera, que
 * dura `wholeMs` con su cierre, para que cada corte suene igual que en la animación completa.
 */
interface RenderInfo {
  durationMs: number;
  width: number;
  height: number;
  beats: CutBeat[];
  fromMs: number;
  wholeMs: number;
}

type RenderWindow = Window & {
  __renderFrame?: (ms: number) => Promise<void>;
  __renderInfo?: RenderInfo;
};

/** Un canal de tiempo que no corre solo: lo empuja quien graba, cuadro por cuadro. */
function useManualFeed(): {
  feed: ClockFeed;
  publish: (elapsedMs: number) => void;
} {
  const listenersRef = useRef(new Set<(frame: ClockFrame) => void>());
  const elapsedRef = useRef(0);
  const feed = useMemo<ClockFeed>(
    () => ({
      subscribe(listener) {
        listenersRef.current.add(listener);
        listener({ elapsedMs: elapsedRef.current, playing: true });
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [],
  );
  const publish = useCallback((elapsedMs: number) => {
    elapsedRef.current = elapsedMs;
    for (const listener of listenersRef.current) {
      listener({ elapsedMs, playing: true });
    }
  }, []);
  return { feed, publish };
}

function nextFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

async function imagesReady(root: HTMLElement): Promise<void> {
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map((image) =>
      image.complete
        ? image.decode().catch(() => undefined)
        : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

function artAt(sceneIndex: number, beatIndex: number): string {
  const sceneId = PILLARS_OVERVIEW_SCRIPT[sceneIndex].id;
  return OVERVIEW_SCENES[sceneId].beats[beatIndex].art;
}

/** El subtítulo de un instante, con cada palabra y su subrayado donde les toca. */
function FrameCaption({
  segments,
  accent,
}: {
  segments: FrameSegment[];
  accent: string;
}) {
  return (
    <p className="m-0">
      {segments.map((segment, segmentIndex) => {
        const words = segment.parts.map((part, partIndex) => {
          if (part === " ") return " ";
          const eased = easeOut(part.progress);
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: el orden de las palabras es el texto mismo.
              key={partIndex}
              style={{
                display: "inline-block",
                opacity: eased,
                transform: `translateY(${(1 - eased) * 0.45}em)`,
                filter: eased < 1 ? `blur(${(1 - eased) * 10}px)` : undefined,
              }}
            >
              {part.text}
            </span>
          );
        });
        if (!segment.highlight) {
          // biome-ignore lint/suspicious/noArrayIndexKey: los tramos no se reordenan.
          return <span key={segmentIndex}>{words}</span>;
        }
        return (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: los tramos no se reordenan.
            key={segmentIndex}
            style={{
              color: "#fff",
              fontWeight: 700,
              padding: "0 0.08em",
              borderRadius: "0.2em",
              boxDecorationBreak: "clone",
              backgroundColor: "transparent",
              backgroundImage: `linear-gradient(${accent}cc, ${accent}cc)`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0 92%",
              backgroundSize: `${segment.markProgress * 100}% 42%`,
            }}
          >
            {words}
          </mark>
        );
      })}
    </p>
  );
}

/**
 * La animación de los cuatro pilares compuesta para redes, en un formato y un corte.
 *
 * No se reproduce: se **dibuja en un instante**. Expone `window.__renderFrame(ms)`, que la lleva a
 * ese instante y espera a que todo esté pintado (y las imágenes decodificadas); el script de
 * exportación lo llama cuadro por cuadro y captura. Por eso aquí no hay transiciones ni animaciones
 * CSS: todo lo que se mueve es función del tiempo, y el cuadro 312 sale igual cada vez.
 */
export default function SocialComposition({
  cut,
  format,
  captions,
  chips,
  outroTitle,
  siteUrl,
}: {
  cut: SocialCut;
  format: SocialFormat;
  captions: readonly (readonly string[])[];
  chips: readonly string[];
  outroTitle: string;
  siteUrl: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const range: CutRange = useMemo(() => cutRange(cut), [cut]);
  const { width, height } = SOCIAL_FORMATS[format];
  const layout = LAYOUTS[format];
  const { feed, publish } = useManualFeed();
  const [localMs, setLocalMs] = useState(0);

  const span = range.toMs - range.fromMs;
  const absoluteAt = useCallback(
    (ms: number) => range.fromMs + Math.min(Math.max(ms, 0), span - 1),
    [range.fromMs, span],
  );

  useEffect(() => {
    const target = window as RenderWindow;
    target.__renderInfo = {
      durationMs: range.durationMs,
      width,
      height,
      beats: cutBeats(range),
      fromMs: range.fromMs,
      wholeMs: cutRange("completo").durationMs,
    };
    target.__renderFrame = async (ms: number) => {
      publish(absoluteAt(ms));
      flushSync(() => setLocalMs(ms));
      await nextFrames(2);
      if (rootRef.current) await imagesReady(rootRef.current);
      await nextFrames(1);
    };
    return () => {
      target.__renderFrame = undefined;
      target.__renderInfo = undefined;
    };
  }, [publish, absoluteAt, range, width, height]);

  const absolute = absoluteAt(localMs);
  const playhead = playheadAt(PILLARS_OVERVIEW_SCRIPT, absolute);
  const scene = PILLARS_OVERVIEW_SCRIPT[playhead.sceneIndex];
  const timing = OVERVIEW_TIMINGS[playhead.sceneIndex];
  const intoScene = absolute - timing.startMs;
  const beatStartMs = (timing.beatsSec[playhead.beatIndex] ?? 0) * 1000;
  const intoBeat = intoScene - beatStartMs;
  const accent = SCENE_ACCENTS[scene.id];
  const outroMs = localMs - span;
  const outro = outroMs >= 0 ? Math.min(1, outroMs / OUTRO_FADE_MS) : 0;

  const firstScene = range.sceneIndexes[0];
  const layers =
    playhead.sceneIndex > firstScene && intoScene < OUTGOING_MS
      ? [playhead.sceneIndex - 1, playhead.sceneIndex]
      : [playhead.sceneIndex];

  /* El fondo es la ilustración del momento, desenfocada; al cambiar de ilustración, la nueva entra
     sobre la anterior en un segundo, calculado y no con una transición CSS. */
  const currentArt = artAt(playhead.sceneIndex, playhead.beatIndex);
  const previousArt =
    playhead.beatIndex > 0
      ? artAt(playhead.sceneIndex, playhead.beatIndex - 1)
      : playhead.sceneIndex > firstScene
        ? artAt(
            playhead.sceneIndex - 1,
            PILLARS_OVERVIEW_SCRIPT[playhead.sceneIndex - 1].beatDurationsMs
              .length - 1,
          )
        : null;
  const backdropMix = Math.min(1, intoBeat / BACKDROP_FADE_MS);

  /* La barra de progreso: por escenas en la pieza completa, por subtítulos en la de un pilar. */
  const segments =
    range.sceneIndexes.length > 1
      ? range.sceneIndexes.map((index) => {
          const start = OVERVIEW_TIMINGS[index].startMs;
          const length = OVERVIEW_TIMINGS[index].durationSec * 1000;
          return Math.min(1, Math.max(0, (absolute - start) / length));
        })
      : timing.beatsSec.map((beatStart, index) => {
          const beatEnd = timing.beatsSec[index + 1] ?? timing.durationSec;
          return Math.min(
            1,
            Math.max(0, (intoScene / 1000 - beatStart) / (beatEnd - beatStart)),
          );
        });
  const markup = captions[playhead.sceneIndex]?.[playhead.beatIndex] ?? "";
  const overlaidCaption = format === "horizontal";

  return (
    <div
      ref={rootRef}
      data-testid="social-composition"
      data-absolute={absolute}
      data-local={localMs}
      className="relative overflow-hidden text-white"
      style={{ width, height, backgroundColor: "#0b0718" }}
    >
      {!overlaidCaption && (
        <>
          {[previousArt, currentArt].map((art, index) =>
            art ? (
              // biome-ignore lint/performance/noImgElement: fondo de exportación a video, servido tal cual (la optimización de Next está apagada).
              <img
                key={`${art}-${index === 0 ? "previa" : "actual"}`}
                src={artSources(art).src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  filter: "blur(48px) saturate(1.15)",
                  transform: "scale(1.25)",
                  opacity: index === 0 ? 1 : backdropMix,
                }}
              />
            ) : null,
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgb(8 5 20 / 0.45), rgb(8 5 20 / 0.25) 35%, rgb(8 5 20 / 0.72))",
            }}
          />
        </>
      )}

      <div
        className="absolute overflow-hidden"
        style={{
          top: layout.stage.top,
          left: layout.stage.left,
          width: layout.stage.width,
          height: layout.stage.height,
          borderRadius: layout.stage.radius,
          boxShadow: overlaidCaption
            ? undefined
            : "0 40px 80px -20px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.12)",
        }}
      >
        {layers.map((index) => {
          const config = OVERVIEW_SCENES[PILLARS_OVERVIEW_SCRIPT[index].id];
          const isCurrent = index === playhead.sceneIndex;
          return (
            <div
              key={PILLARS_OVERVIEW_SCRIPT[index].id}
              className="absolute inset-0"
            >
              <IllustratedScene
                beats={config.beats}
                logo={config.logo}
                timing={OVERVIEW_TIMINGS[index]}
                active={isCurrent}
                steps={!isCurrent}
                feed={feed}
              />
            </div>
          );
        })}
      </div>

      {overlaidCaption && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "55%",
            background:
              "linear-gradient(to top, rgb(8 5 20 / 0.85), rgb(8 5 20 / 0.45) 55%, transparent)",
          }}
        />
      )}

      <header
        className="absolute flex items-center gap-5"
        style={{
          top: layout.header.top,
          left: layout.header.left,
          right: layout.header.right,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: logo en la exportación a video, servido tal cual. */}
        <img
          src="/logo.webp"
          alt={PUBLIC_BRAND_NAME}
          style={{ width: layout.header.logo, height: layout.header.logo }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <span
            className="inline-flex items-center gap-3 self-start rounded-full font-semibold"
            style={{
              fontSize: layout.header.chip,
              padding: "0.3em 0.9em",
              backgroundColor: "rgb(0 0 0 / 0.35)",
              border: "1px solid rgb(255 255 255 / 0.2)",
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: "0.55em",
                height: "0.55em",
                backgroundColor: accent,
              }}
            />
            {chips[playhead.sceneIndex]}
          </span>
          <div className="flex gap-2">
            {segments.map((fill, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: una pista por escena o subtítulo, en su orden.
                key={index}
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ backgroundColor: "rgb(255 255 255 / 0.28)" }}
              >
                <span
                  className="block h-full rounded-full bg-white"
                  style={{ width: `${fill * 100}%` }}
                />
              </span>
            ))}
          </div>
        </div>
      </header>

      <div
        className="absolute font-semibold tracking-tight"
        style={{
          top: layout.caption.top,
          bottom: layout.caption.bottom,
          left: layout.caption.left,
          right: layout.caption.right,
          fontSize: layout.caption.size,
          lineHeight: 1.22,
          textWrap: "balance",
          opacity: 1 - outro,
          textShadow: "0 2px 18px rgb(0 0 0 / 0.45)",
        }}
      >
        <FrameCaption segments={captionAt(markup, intoBeat)} accent={accent} />
      </div>

      <footer
        className="absolute inset-x-0 text-center font-semibold"
        style={{
          bottom: layout.footer.bottom,
          fontSize: layout.footer.size,
          opacity: 0.9 * (1 - outro),
          letterSpacing: "0.02em",
        }}
      >
        {siteUrl}
      </footer>

      {outro > 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-center"
          style={{
            opacity: outro,
            background:
              "radial-gradient(80% 60% at 50% 45%, rgb(42 20 80 / 0.92), rgb(8 5 20 / 0.97))",
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: logo en la exportación a video, servido tal cual. */}
          <img
            src="/logo.webp"
            alt={PUBLIC_BRAND_NAME}
            style={{
              width: Math.min(width, height) * 0.42,
              transform: `scale(${0.85 + 0.15 * easeOut(outro)})`,
            }}
          />
          <p
            className="m-0 font-semibold"
            style={{
              fontSize: layout.caption.size * 0.9,
              maxWidth: "80%",
              textWrap: "balance",
            }}
          >
            {outroTitle}
          </p>
          <p
            className="m-0 font-bold"
            style={{ fontSize: layout.caption.size * 0.75, color: accent }}
          >
            {siteUrl}
          </p>
        </div>
      )}
    </div>
  );
}
