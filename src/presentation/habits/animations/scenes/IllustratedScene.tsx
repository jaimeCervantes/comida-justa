"use client";
import { useRef } from "react";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { ART_SIZES, artSources } from "./artSources";
import {
  type ArtPoint,
  type Atmosphere,
  AtmosphereLayer,
  animateAtmosphere,
} from "./atmosphere";
import { seededRandom } from "./seededRandom";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

/** Un encuadre: cuánto se acerca la cámara y cuánto se desplaza, en % del cuadro. */
interface Framing {
  scale: number;
  x?: number;
  y?: number;
}

/** El movimiento de cámara de una ilustración mientras dura su subtítulo. */
export interface CameraMove {
  /** Hacia dónde se acerca o de dónde se aleja la cámara. Por omisión, el centro. */
  origin?: ArtPoint;
  from: Framing;
  to: Framing;
}

/** Lo que se ve durante un subtítulo: una ilustración, su cámara y lo que se mueve encima. */
export interface IllustratedBeat {
  art: string;
  camera: CameraMove;
  atmosphere?: readonly Atmosphere[];
}

/** Cuánto dura el fundido entre dos ilustraciones, centrado en el cambio de subtítulo. */
const CROSSFADE_SEC = 1;

const random = seededRandom(2026);
const CONFETTI_COLORS = ["#a78bfa", "#fb923c", "#4ade80", "#38bdf8"];
const CONFETTI = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2 + random() * 0.3;
  const distance = 320 + random() * 380;
  return {
    id: `confetti-${index}`,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance * 0.7,
    rotation: random() * 540 - 270,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: index % 3 === 0,
  };
});

/**
 * Una escena contada con ilustraciones: una por subtítulo, con fundido entre ellas.
 *
 * La cámara nunca está quieta —se acerca, se aleja o recorre el cuadro despacio— y encima de cada
 * ilustración vive lo que la hace un plano y no una diapositiva: brasas, estrellas, polvo en la
 * luz. Todo va en la línea de tiempo de la escena, gobernada por el reloj del guion.
 *
 * `logo` pone la marca: al abrir (grande, y luego en la esquina) o al cerrar (sobre el cielo, con
 * confeti de los cuatro colores).
 */
export default function IllustratedScene({
  beats,
  logo,
  ...props
}: SceneProps & {
  beats: readonly IllustratedBeat[];
  logo?: "opening" | "closing";
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useSceneTimeline(rootRef, props, ({ tl, q, beat, duration, loop }) => {
    tl.from(q(".scene"), { opacity: 0, duration: 0.8, ease: "power2.out" }, 0);

    beats.forEach((item, index) => {
      const start = beat(index);
      const end = index + 1 < beats.length ? beat(index + 1) : duration;
      const fadeIn = Math.max(0, start - CROSSFADE_SEC / 2);
      const holdUntil = Math.min(duration, end + CROSSFADE_SEC / 2);
      if (index > 0) {
        tl.fromTo(
          q(`.beat-${index}`),
          { opacity: 0 },
          {
            opacity: 1,
            duration: CROSSFADE_SEC,
            ease: "power1.inOut",
            immediateRender: false,
          },
          fadeIn,
        );
      }
      const origin = item.camera.origin ?? { x: 50, y: 50 };
      tl.fromTo(
        q(`.camera-${index}`),
        {
          scale: item.camera.from.scale,
          xPercent: item.camera.from.x ?? 0,
          yPercent: item.camera.from.y ?? 0,
          transformOrigin: `${origin.x}% ${origin.y}%`,
        },
        {
          scale: item.camera.to.scale,
          xPercent: item.camera.to.x ?? 0,
          yPercent: item.camera.to.y ?? 0,
          duration: holdUntil - fadeIn,
          ease: "sine.inOut",
        },
        fadeIn,
      );
      if (item.atmosphere) {
        animateAtmosphere(tl, q, item.atmosphere, item.art, fadeIn, holdUntil);
      }
    });

    if (logo === "opening") {
      tl.fromTo(
        q(".logo"),
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.6)" },
        0.1,
      );
      tl.fromTo(
        q(".logo-veil"),
        { opacity: 0 },
        { opacity: 1, duration: 0.8 },
        0,
      );
      tl.to(
        q(".logo"),
        {
          left: "86%",
          top: "5%",
          width: "11%",
          duration: 1.1,
          ease: "power3.inOut",
        },
        2.6,
      );
      tl.to(q(".logo-veil"), { opacity: 0, duration: 1 }, 2.6);
    }

    if (logo === "closing") {
      const reveal = beat(beats.length - 1, 0.3);
      tl.fromTo(
        q(".logo"),
        { opacity: 0, scale: 0.6, y: 12 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: "back.out(1.6)",
          immediateRender: false,
        },
        reveal,
      );
      loop(q(".logo"), { y: -6 }, 1.4, reveal + 1.3, duration);
      q(".confetti").forEach((piece, index) => {
        const flight = CONFETTI[index];
        if (!flight) return;
        tl.fromTo(
          piece,
          {
            x: 0,
            y: 0,
            scale: 0,
            rotation: 0,
            opacity: 1,
            transformOrigin: "50% 50%",
          },
          {
            x: flight.dx,
            y: flight.dy,
            scale: 1,
            rotation: flight.rotation,
            duration: 1.8,
            ease: "power3.out",
            immediateRender: false,
          },
          reveal + 0.5,
        );
        tl.to(piece, { opacity: 0, duration: 0.8 }, reveal + 1.7);
      });
    }
  });

  return (
    <div ref={rootRef} className="absolute inset-0" aria-hidden="true">
      <div className="scene absolute inset-0 overflow-hidden bg-slate-950">
        {beats.map((item, index) => {
          const sources = artSources(item.art);
          return (
            <div
              key={item.art}
              className={`beat-${index} absolute inset-0 overflow-hidden`}
              style={index === 0 ? undefined : { opacity: 0 }}
            >
              <div
                className={`camera-${index} absolute inset-0 will-change-transform`}
              >
                {/* biome-ignore lint/performance/noImgElement: la optimización de Next está apagada (`unoptimized`) y este cuadro necesita su propio srcSet con los tres anchos preparados de antemano. */}
                <img
                  src={sources.src}
                  srcSet={sources.srcSet}
                  sizes={ART_SIZES}
                  alt=""
                  draggable={false}
                  decoding="async"
                  loading={index === 0 ? "lazy" : "eager"}
                  className="absolute inset-0 h-full w-full object-cover select-none"
                />
                {item.atmosphere && (
                  <AtmosphereLayer items={item.atmosphere} name={item.art} />
                )}
              </div>
            </div>
          );
        })}

        {logo === "opening" && (
          <div
            className="logo-veil pointer-events-none absolute inset-0"
            style={{
              opacity: 0,
              background:
                "radial-gradient(60% 70% at 50% 38%, rgb(15 10 35 / 0.55), transparent 75%)",
            }}
          />
        )}
        {logo === "closing" && (
          <svg
            viewBox="0 0 1920 1072"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <g transform="translate(960 320)">
              {CONFETTI.map((piece) =>
                piece.round ? (
                  <circle
                    key={piece.id}
                    className="confetti"
                    r={11}
                    fill={piece.color}
                    opacity={0}
                  />
                ) : (
                  <rect
                    key={piece.id}
                    className="confetti"
                    x={-14}
                    y={-7}
                    width={28}
                    height={14}
                    rx={3}
                    fill={piece.color}
                    opacity={0}
                  />
                ),
              )}
            </g>
          </svg>
        )}
        {logo && (
          // biome-ignore lint/performance/noImgElement: el logo ya está publicado a 500 px y aquí solo se anima su posición; `next/image` sin optimización no aporta nada.
          <img
            className="logo pointer-events-none absolute h-auto drop-shadow-2xl select-none"
            data-testid="animation-logo"
            src="/logo.webp"
            alt={PUBLIC_BRAND_NAME}
            draggable={false}
            style={
              logo === "opening"
                ? { left: "35%", top: "6%", width: "30%" }
                : /* Sobre el cielo y por encima de las cabezas: el logo es cuadrado, así que su
                     alto es 16/9 de su ancho medido en alto del cuadro. */
                  { left: "39.5%", top: "1.5%", width: "21%", opacity: 0 }
            }
          />
        )}
      </div>
    </div>
  );
}
