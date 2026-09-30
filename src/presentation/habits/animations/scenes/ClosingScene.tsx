"use client";
import { useRef } from "react";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import {
  Glow,
  PILLAR_COLORS,
  PillarBadge,
  SceneSvg,
  seededRandom,
  useSvgIds,
} from "./kit";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

const CENTER = { x: 160, y: 88 } as const;
const RADIUS = 50;
const RING = `M${CENTER.x} ${CENTER.y - RADIUS} A${RADIUS} ${RADIUS} 0 1 1 ${CENTER.x} ${CENTER.y + RADIUS} A${RADIUS} ${RADIUS} 0 1 1 ${CENTER.x} ${CENTER.y - RADIUS}`;

/** Los cuatro, en el orden de la marca y en el sentido de las agujas del reloj. */
const STATIONS: readonly { pillar: PillarKey; x: number; y: number }[] = [
  { pillar: "sleep", x: CENTER.x, y: CENTER.y - RADIUS },
  { pillar: "nutrition", x: CENTER.x + RADIUS, y: CENTER.y },
  { pillar: "movement", x: CENTER.x, y: CENTER.y + RADIUS },
  { pillar: "mindSpirit", x: CENTER.x - RADIUS, y: CENTER.y },
];
const ARCS = STATIONS.map((from, index) => {
  const to = STATIONS[(index + 1) % STATIONS.length];
  return {
    pillar: from.pillar,
    d: `M${from.x} ${from.y} A${RADIUS} ${RADIUS} 0 0 1 ${to.x} ${to.y}`,
  };
});
const ORBITERS = Array.from({ length: 8 }, (_, index) => index / 8);

/** El confeti: direcciones y distancias fijas, en los colores de los cuatro. */
const random = seededRandom(4);
const CONFETTI_COLORS = Object.values(PILLAR_COLORS).map(
  (color) => color.light,
);
const CONFETTI = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2 + random() * 0.3;
  const distance = 60 + random() * 70;
  return {
    id: `confetti-${index}`,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance * 0.7,
    rotation: random() * 540 - 270,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: index % 3 === 0,
  };
});

const LOGO = { x: 108, y: 22, size: 104 } as const;

/**
 * El cierre.
 *
 * 1. Los cuatro, en un anillo: se conectan, y por el anillo corre energía. Se iluminan los dos
 *    puentes que nombra el subtítulo —el movimiento de día llama al sueño; la mesa sin pantallas
 *    alimenta la mente—, que se cruzan en el corazón.
 * 2. El anillo se queda de fondo y la marca pasa al frente, con confeti de los cuatro colores.
 */
export default function ClosingScene(props: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgIds();

  useSceneTimeline(svgRef, props, ({ tl, q, beat, duration, loop }) => {
    tl.from(q(".scene"), { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
    loop(q(".blob-a"), { x: 18, y: 10 }, 5);
    loop(q(".blob-b"), { x: -16, y: -8 }, 6);

    // 1 · Se sostienen entre sí.
    tl.from(
      q(".station"),
      {
        scale: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: "back.out(2.4)",
        transformOrigin: "50% 50%",
      },
      0.3,
    );
    tl.fromTo(
      q(".arc"),
      { strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        stagger: 0.3,
        duration: 0.7,
        ease: "power1.inOut",
      },
      0.8,
    );
    const ring = q(".ring-path")[0] as SVGPathElement;
    q(".orbiter").forEach((orbiter, index) => {
      const start = ORBITERS[index] ?? 0;
      tl.fromTo(orbiter, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 2.2);
      tl.to(
        orbiter,
        {
          motionPath: {
            path: ring,
            align: ring,
            alignOrigin: [0.5, 0.5],
            start,
            end: start + 1,
          },
          duration: 4,
          ease: "none",
          repeat: 1,
        },
        2.2,
      );
    });
    tl.from(
      q(".heart"),
      {
        scale: 0,
        duration: 0.6,
        ease: "back.out(2.6)",
        transformOrigin: "50% 50%",
      },
      2.2,
    );
    loop(
      q(".heart"),
      { scale: 1.14, transformOrigin: "50% 50%" },
      0.5,
      2.8,
      beat(1),
    );
    tl.fromTo(
      q(".bridge-day"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
      2.6,
    );
    tl.fromTo(
      q(".bridge-table"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
      4.4,
    );
    tl.fromTo(
      q(".glow-movement, .glow-sleep"),
      { opacity: 0 },
      { opacity: 1, duration: 0.5, yoyo: true, repeat: 1 },
      3.2,
    );
    tl.fromTo(
      q(".glow-nutrition, .glow-mindSpirit"),
      { opacity: 0 },
      { opacity: 1, duration: 0.5, yoyo: true, repeat: 1 },
      5,
    );

    // 2 · La marca pasa al frente.
    tl.from(q(".logo"), { opacity: 0, duration: 0.6 }, 0.5);
    tl.to(
      q(".ring"),
      {
        scale: 0.78,
        opacity: 0.22,
        svgOrigin: `${CENTER.x} ${CENTER.y}`,
        duration: 0.9,
        ease: "power2.inOut",
      },
      beat(1),
    );
    tl.fromTo(
      q(".logo"),
      { x: 98, y: -42, scale: 0.36, transformOrigin: "50% 50%" },
      { x: 0, y: 0, scale: 1, duration: 1.1, ease: "back.out(1.4)" },
      beat(1, 0.2),
    );
    tl.from(
      q(".logo-glow"),
      { opacity: 0, scale: 0.4, duration: 1.2, transformOrigin: "50% 50%" },
      beat(1, 0.5),
    );
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
        },
        beat(1, 0.9),
      );
      tl.to(piece, { opacity: 0, duration: 0.8 }, beat(1, 2.1));
    });
    loop(q(".logo"), { y: -3 }, 1.4, beat(1, 1.6), duration);
  });

  return (
    <SceneSvg svgRef={svgRef}>
      <defs>
        <linearGradient id={id("bg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#130b2b" />
          <stop offset="1" stopColor="#2a1450" />
        </linearGradient>
        <linearGradient
          id={id("day")}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={CENTER.y + RADIUS}
          x2="0"
          y2={CENTER.y - RADIUS}
        >
          <stop offset="0" stopColor={PILLAR_COLORS.movement.light} />
          <stop offset="1" stopColor={PILLAR_COLORS.sleep.light} />
        </linearGradient>
        <linearGradient
          id={id("table")}
          gradientUnits="userSpaceOnUse"
          x1={CENTER.x + RADIUS}
          y1="0"
          x2={CENTER.x - RADIUS}
          y2="0"
        >
          <stop offset="0" stopColor={PILLAR_COLORS.nutrition.light} />
          <stop offset="1" stopColor={PILLAR_COLORS.mindSpirit.light} />
        </linearGradient>
      </defs>

      <g className="scene">
        <rect width={320} height={180} fill={`url(#${id("bg")})`} />
        <g className="blob-a">
          <Glow cx={80} cy={40} r={110} color="#7c3aed" opacity={0.45} />
        </g>
        <g className="blob-b">
          <Glow cx={250} cy={150} r={120} color="#22c55e" opacity={0.25} />
        </g>

        <g className="ring">
          <path
            className="ring-path"
            d={RING}
            stroke="#fff"
            strokeOpacity={0.08}
            strokeWidth={6}
            fill="none"
          />
          {ARCS.map(({ pillar, d }) => (
            <path
              key={pillar}
              className="arc"
              d={d}
              pathLength={1}
              strokeDasharray={1}
              stroke={PILLAR_COLORS[pillar].light}
              strokeWidth={2.4}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <path
            className="bridge-day"
            d={`M${CENTER.x} ${CENTER.y + RADIUS - 12} V${CENTER.y - RADIUS + 12}`}
            pathLength={1}
            strokeDasharray={1}
            stroke={`url(#${id("day")})`}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            className="bridge-table"
            d={`M${CENTER.x + RADIUS - 12} ${CENTER.y} H${CENTER.x - RADIUS + 12}`}
            pathLength={1}
            strokeDasharray={1}
            stroke={`url(#${id("table")})`}
            strokeWidth={2}
            strokeLinecap="round"
          />
          {ORBITERS.map((start) => (
            <circle
              key={start}
              className="orbiter"
              cx={CENTER.x}
              cy={CENTER.y - RADIUS}
              r={1.6}
              fill="#fff"
              opacity={0}
            />
          ))}
          <g transform={`translate(${CENTER.x} ${CENTER.y})`}>
            <g className="heart">
              <Glow cx={0} cy={0} r={18} color="#fb7185" opacity={0.6} />
              <path
                d="M0 6 C-8 0 -7 -7 -2.5 -7 C-1 -7 0 -6 0 -5 C0 -6 1 -7 2.5 -7 C7 -7 8 0 0 6 Z"
                fill="#fb7185"
              />
            </g>
          </g>
          {STATIONS.map(({ pillar, x, y }) => (
            <g key={pillar} transform={`translate(${x} ${y})`}>
              <g className={`glow-${pillar}`} opacity={0}>
                <Glow
                  cx={0}
                  cy={0}
                  r={30}
                  color={PILLAR_COLORS[pillar].light}
                  opacity={0.8}
                />
              </g>
              <PillarBadge className="station" pillar={pillar} r={12} />
            </g>
          ))}
        </g>

        <g
          transform={`translate(${LOGO.x + LOGO.size / 2} ${LOGO.y + LOGO.size / 2})`}
        >
          {CONFETTI.map((piece) =>
            piece.round ? (
              <circle
                key={piece.id}
                className="confetti"
                r={2}
                fill={piece.color}
                opacity={0}
              />
            ) : (
              <rect
                key={piece.id}
                className="confetti"
                x={-2.5}
                y={-1.2}
                width={5}
                height={2.4}
                rx={0.6}
                fill={piece.color}
                opacity={0}
              />
            ),
          )}
        </g>
        <Glow
          className="logo-glow"
          cx={LOGO.x + LOGO.size / 2}
          cy={LOGO.y + LOGO.size / 2}
          r={84}
          color="#fb7185"
          opacity={0.5}
        />
        <image
          className="logo"
          data-testid="animation-logo"
          href="/logo.webp"
          x={LOGO.x}
          y={LOGO.y}
          width={LOGO.size}
          height={LOGO.size}
        />
      </g>
    </SceneSvg>
  );
}
