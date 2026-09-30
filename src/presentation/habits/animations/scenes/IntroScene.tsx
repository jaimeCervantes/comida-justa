"use client";
import { useRef } from "react";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import {
  breathe,
  CAST,
  Glow,
  Person,
  PILLAR_COLORS,
  PillarBadge,
  SceneSvg,
  seededRandom,
  useSvgIds,
} from "./kit";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

/** Cientos de miles de años de días parecidos: arcos de sol, uno tras otro, sin prisa. */
const DAY_ARCS = Array.from({ length: 9 }, (_, index) => 50 + index * 19.5);

/** El último siglo, apretado al final de la línea. */
const ERA_ICONS = [238, 248, 258, 268] as const;

/** La cabeza llena: un garabato que se enreda sobre sí mismo. */
const SCRIBBLE =
  "M144 50 C148 36 170 38 168 50 C166 62 146 60 150 47 C154 34 178 42 172 55 C166 66 148 56 156 44 C164 32 180 48 168 58";
/** …y la misma línea, en calma. */
const CALM_WAVE = "M140 50 Q150 43 160 50 T180 50";

const COLUMNS: readonly { pillar: PillarKey; x: number }[] = [
  { pillar: "sleep", x: 88 },
  { pillar: "nutrition", x: 136 },
  { pillar: "movement", x: 184 },
  { pillar: "mindSpirit", x: 232 },
];

const random = seededRandom(7);
const MOTES = Array.from({ length: 12 }, () => ({
  x: 64 + random() * 192,
  y: 64 + random() * 76,
  r: 0.7 + random() * 0.8,
}));

/**
 * El gancho: un cuerpo antiguo en un mundo nuevo.
 *
 * 1. El logo, y una línea del tiempo larguísima y tranquila que estalla en su último tramo.
 * 2. Alguien sin energía, con la cabeza llena y lejos de los demás… y el alivio: el garabato se
 *    vuelve una onda tranquila, la batería se recarga, los demás se acercan.
 * 3. Se levantan cuatro pilares.
 */
export default function IntroScene(props: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgIds();

  useSceneTimeline(svgRef, props, ({ tl, q, beat, duration, loop }) => {
    tl.from(q(".scene"), { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
    loop(q(".blob-a"), { x: 18, y: 10 }, 5);
    loop(q(".blob-b"), { x: -16, y: -8 }, 6);

    // 1 · El logo y la línea del tiempo.
    tl.from(
      q(".logo"),
      {
        opacity: 0,
        scale: 0.7,
        y: 8,
        duration: 1.2,
        ease: "back.out(1.6)",
        transformOrigin: "50% 50%",
      },
      0.1,
    );
    tl.from(
      q(".logo-glow"),
      { opacity: 0, scale: 0.4, duration: 1.4, transformOrigin: "50% 50%" },
      0.1,
    );
    tl.to(
      q(".logo"),
      { x: 98, y: -42, scale: 0.36, duration: 1.1, ease: "power3.inOut" },
      2.6,
    );
    tl.to(q(".logo-glow"), { opacity: 0, duration: 0.8 }, 2.6);
    tl.fromTo(
      q(".tl-line"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 2.8, ease: "power1.inOut" },
      1.3,
    );
    tl.from(q(".day"), { opacity: 0, y: 4, stagger: 0.24, duration: 0.5 }, 1.5);
    tl.fromTo(
      q(".ecg"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 0.8, ease: "power2.in" },
      3.6,
    );
    tl.from(
      q(".era"),
      {
        scale: 0,
        opacity: 0,
        stagger: 0.14,
        duration: 0.5,
        ease: "back.out(3)",
        transformOrigin: "50% 100%",
      },
      3.8,
    );
    loop(q(".era"), { y: -1.6 }, 0.45, 4.9, beat(1));

    // 2 · El desajuste, y el alivio.
    tl.to(
      q(".timeline"),
      { opacity: 0, y: 14, duration: 0.6, ease: "power2.in" },
      beat(1),
    );
    tl.from(q(".hero"), { opacity: 0, y: 12, duration: 0.8 }, beat(1, 0.3));
    tl.from(q(".battery"), { opacity: 0, x: -6, duration: 0.6 }, beat(1, 0.9));
    tl.fromTo(
      q(".scribble"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" },
      beat(1, 1.2),
    );
    tl.to(
      q(".bar-2, .bar-3"),
      { opacity: 0.12, stagger: { each: 0.3, from: "end" }, duration: 0.4 },
      beat(1, 1.4),
    );
    tl.to(q(".bar-1"), { fill: "#ef4444", duration: 0.4 }, beat(1, 2));
    tl.from(q(".far"), { opacity: 0, duration: 0.8 }, beat(1, 1.8));
    tl.to(
      q(".far"),
      { x: 14, duration: 1.8, ease: "sine.inOut" },
      beat(1, 2.2),
    );
    tl.to(
      q(".hero-person"),
      {
        rotation: -7,
        y: 2,
        duration: 1.2,
        ease: "sine.inOut",
        transformOrigin: "50% 100%",
      },
      beat(1, 1.6),
    );
    tl.from(
      q(".relief"),
      { opacity: 0, scale: 0.5, duration: 1.4, transformOrigin: "50% 50%" },
      beat(1, 4),
    );
    tl.to(
      q(".scribble"),
      {
        morphSVG: CALM_WAVE,
        stroke: "#fde68a",
        duration: 1.3,
        ease: "power2.inOut",
      },
      beat(1, 4.3),
    );
    tl.to(
      q(".hero-person"),
      { rotation: 0, y: 0, duration: 1, ease: "back.out(1.4)" },
      beat(1, 4.6),
    );
    tl.to(
      q(".bar-2, .bar-3"),
      { opacity: 1, stagger: 0.25, duration: 0.3 },
      beat(1, 5),
    );
    tl.to(q(".bar-1"), { fill: "#22c55e", duration: 0.3 }, beat(1, 5));
    tl.to(
      q(".far"),
      { x: -30, opacity: 1, duration: 1.6, ease: "power2.out" },
      beat(1, 5.2),
    );
    loop(q(".scribble"), { y: -2 }, 1.1, beat(1, 5.6), beat(2));

    breathe(tl, q(".hero-person"), beat(1, 0.4), beat(2));
    breathe(tl, q(".far"), beat(1, 1.8), beat(2), 2.2);

    // 3 · Cuatro pilares.
    tl.to(
      q(".act-mismatch"),
      { opacity: 0, y: 10, duration: 0.6, ease: "power2.in" },
      beat(2),
    );
    tl.from(
      q(".plinth"),
      { opacity: 0, scaleX: 0.3, duration: 0.8, transformOrigin: "50% 50%" },
      beat(2, 0.2),
    );
    tl.from(
      q(".column"),
      {
        scaleY: 0,
        stagger: 0.18,
        duration: 0.9,
        ease: "back.out(1.5)",
        transformOrigin: "50% 100%",
      },
      beat(2, 0.3),
    );
    tl.from(
      q(".column-badge"),
      {
        scale: 0,
        opacity: 0,
        stagger: 0.18,
        duration: 0.6,
        ease: "back.out(2.4)",
        transformOrigin: "50% 50%",
      },
      beat(2, 0.8),
    );
    loop(q(".column-badge"), { y: -2 }, 1.1, beat(2, 1.9), duration);
    tl.from(
      q(".mote"),
      { opacity: 0, stagger: 0.08, duration: 0.6 },
      beat(2, 1),
    );
    loop(q(".mote"), { y: -10 }, 1.8, beat(2, 2), duration);
  });

  return (
    <SceneSvg svgRef={svgRef}>
      <defs>
        <linearGradient id={id("bg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#130b2b" />
          <stop offset="1" stopColor="#2a1450" />
        </linearGradient>
        <linearGradient
          id={id("line")}
          gradientUnits="userSpaceOnUse"
          x1="48"
          y1="0"
          x2="272"
          y2="0"
        >
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="0.74" stopColor="#fbbf24" />
          <stop offset="0.86" stopColor="#f43f5e" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        {COLUMNS.map(({ pillar }) => (
          <linearGradient
            key={pillar}
            id={id(`column-${pillar}`)}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor={PILLAR_COLORS[pillar].light} />
            <stop offset="1" stopColor={PILLAR_COLORS[pillar].base} />
          </linearGradient>
        ))}
      </defs>

      <g className="scene">
        <rect width={320} height={180} fill={`url(#${id("bg")})`} />
        <g className="blob-a">
          <Glow cx={74} cy={44} r={110} color="#7c3aed" opacity={0.45} />
        </g>
        <g className="blob-b">
          <Glow cx={262} cy={150} r={120} color="#f97316" opacity={0.35} />
        </g>

        {/* 1 · La línea del tiempo. */}
        <g className="timeline">
          <path
            className="tl-line"
            d="M48 146 H272"
            pathLength={1}
            strokeDasharray={1}
            stroke={`url(#${id("line")})`}
            strokeWidth={2.2}
            fill="none"
          />
          {DAY_ARCS.map((x) => (
            <g key={x} className="day">
              <path
                d={`M${x} 146 A9 9 0 0 1 ${x + 18} 146`}
                stroke="#fbbf24"
                strokeOpacity={0.55}
                strokeWidth={1.1}
                fill="none"
              />
              <circle cx={x + 9} cy={137} r={1.6} fill="#fde68a" />
            </g>
          ))}
          <path
            className="ecg"
            d="M228 146 L234 146 L237 136 L240 154 L243 132 L246 158 L249 138 L252 150 L255 128 L258 160 L261 140 L264 150 L272 146"
            pathLength={1}
            strokeDasharray={1}
            stroke="#f43f5e"
            strokeWidth={1.5}
            strokeLinejoin="round"
            fill="none"
          />
          <g transform={`translate(${ERA_ICONS[0]} 124)`}>
            <g className="era">
              <circle cx={0} cy={-1} r={3.6} fill="#fde047" />
              <rect
                x={-1.6}
                y={2.4}
                width={3.2}
                height={2.2}
                rx={0.6}
                fill="#94a3b8"
              />
            </g>
          </g>
          <g transform={`translate(${ERA_ICONS[1]} 125)`}>
            <g className="era">
              <path d="M-5 4 V-2 L-2 0 V-2 L1 0 V-6 H3.4 V4 Z" fill="#f43f5e" />
              <circle cx={2.4} cy={-8.6} r={1.6} fill="#e2e8f0" opacity={0.7} />
            </g>
          </g>
          <g transform={`translate(${ERA_ICONS[2]} 126)`}>
            <g className="era">
              <rect
                x={-5}
                y={-1.5}
                width={10}
                height={4}
                rx={1.5}
                fill="#22d3ee"
              />
              <rect
                x={-2.6}
                y={-4}
                width={5}
                height={3}
                rx={1}
                fill="#22d3ee"
              />
              <circle cx={-2.8} cy={2.8} r={1.2} fill="#e2e8f0" />
              <circle cx={2.8} cy={2.8} r={1.2} fill="#e2e8f0" />
            </g>
          </g>
          <g transform={`translate(${ERA_ICONS[3]} 124)`}>
            <g className="era">
              <rect
                x={-2.6}
                y={-4.6}
                width={5.2}
                height={9.2}
                rx={1.3}
                fill="#a78bfa"
              />
              <rect
                x={-1.8}
                y={-3.4}
                width={3.6}
                height={6.4}
                rx={0.6}
                fill="#ede9fe"
              />
            </g>
          </g>
        </g>

        {/* 2 · El desajuste. */}
        <g className="act-mismatch">
          <g className="hero">
            <Glow
              className="relief"
              cx={160}
              cy={104}
              r={92}
              color="#fb923c"
              opacity={0.55}
            />
            <g transform="translate(238 150) scale(0.78)">
              <g className="far" opacity={0.45}>
                <Person look={CAST.leo} />
              </g>
            </g>
            <g transform="translate(258 150) scale(0.78)">
              <g className="far" opacity={0.45}>
                <Person look={CAST.sol} />
              </g>
            </g>
            <g transform="translate(160 150) scale(1.45)">
              <g className="hero-person">
                <Person look={CAST.ana} />
              </g>
            </g>
            <path
              className="scribble"
              d={SCRIBBLE}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              stroke="#f472b6"
              strokeWidth={1.8}
              strokeLinecap="round"
              fill="none"
            />
            <g transform="translate(96 94)">
              <g className="battery">
                <rect
                  x={0}
                  y={0}
                  width={20}
                  height={10}
                  rx={2.6}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={1.3}
                />
                <rect
                  x={20.4}
                  y={3.3}
                  width={2}
                  height={3.4}
                  rx={0.8}
                  fill="#e2e8f0"
                />
                <rect
                  className="bar-1"
                  x={2.2}
                  y={2.2}
                  width={4.6}
                  height={5.6}
                  rx={1}
                  fill="#22c55e"
                />
                <rect
                  className="bar-2"
                  x={7.7}
                  y={2.2}
                  width={4.6}
                  height={5.6}
                  rx={1}
                  fill="#22c55e"
                />
                <rect
                  className="bar-3"
                  x={13.2}
                  y={2.2}
                  width={4.6}
                  height={5.6}
                  rx={1}
                  fill="#22c55e"
                />
              </g>
            </g>
          </g>
        </g>

        {/* 3 · Cuatro pilares. */}
        <g className="plinth">
          <Glow cx={160} cy={148} r={120} color="#a78bfa" opacity={0.3} />
          <rect
            x={62}
            y={146}
            width={196}
            height={6}
            rx={3}
            fill="#fff"
            opacity={0.16}
          />
        </g>
        {COLUMNS.map(({ pillar, x }) => (
          <g key={pillar}>
            <g className="column">
              <rect
                x={x - 15}
                y={90}
                width={30}
                height={56}
                rx={9}
                fill={`url(#${id(`column-${pillar}`)})`}
              />
              <rect
                x={x - 11}
                y={96}
                width={5}
                height={44}
                rx={2.5}
                fill="#fff"
                opacity={0.18}
              />
            </g>
            <g transform={`translate(${x} 78)`}>
              <PillarBadge className="column-badge" pillar={pillar} />
            </g>
          </g>
        ))}
        {MOTES.map((mote) => (
          <circle
            key={`${mote.x}-${mote.y}`}
            className="mote"
            cx={mote.x}
            cy={mote.y}
            r={mote.r}
            fill="#fef3c7"
            opacity={0.8}
          />
        ))}

        {/* El logo abre la animación y se queda en la esquina mientras se cuenta. */}
        <Glow
          className="logo-glow"
          cx={160}
          cy={74}
          r={80}
          color="#fb7185"
          opacity={0.5}
        />
        <image
          className="logo"
          data-testid="animation-logo"
          href="/logo.webp"
          x={108}
          y={22}
          width={104}
          height={104}
        />
      </g>
    </SceneSvg>
  );
}
