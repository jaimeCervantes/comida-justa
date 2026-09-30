"use client";
import { useRef } from "react";
import {
  breathe,
  CAST,
  Cloud,
  drift,
  Foliage,
  Glow,
  Person,
  SceneSvg,
  Tree,
  useSvgIds,
  walkCycle,
} from "./kit";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

const DESKS = [
  { x: 100, look: CAST.sol },
  { x: 160, look: CAST.leo },
  { x: 220, look: CAST.tono },
] as const;
const CLOCK = { x: 160, y: 62 } as const;
const CLOCK_TICKS = Array.from({ length: 12 }, (_, index) => index * 30);
const TRAIL = "M30 178 C80 156 110 170 150 150 S230 118 300 110";
const LEAVES = [
  [70, 40],
  [130, 26],
  [190, 44],
  [240, 30],
  [100, 60],
  [220, 64],
] as const;

/**
 * Movimiento, en tres actos.
 *
 * 1. El campo: se camina cargando la cosecha, se trabaja la tierra, se juega. Era vivir.
 * 2. Bajo techo: el techo baja sobre los escritorios mientras el reloj corre horas; afuera, un coche
 *    recorre dos cuadras que cabían a pie.
 * 3. El barrio: se dibuja un sendero, la gente lo recorre y en la cancha rebota un balón.
 */
export default function MovementScene(props: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgIds();

  useSceneTimeline(svgRef, props, ({ tl, q, beat, duration, loop }) => {
    tl.from(q(".scene"), { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
    tl.fromTo(
      q(".camera"),
      { scale: 1.08, svgOrigin: "160 90" },
      { scale: 1, svgOrigin: "160 90", duration: 2.6, ease: "power3.out" },
      0,
    );

    // 1 · Moverse era vivir.
    loop(q(".cloud-a"), { x: 16 }, 3, 0, beat(1));
    loop(q(".cloud-b"), { x: -12 }, 2.6, 0, beat(1));
    tl.to(q(".walker"), { x: 84, duration: 4.9, ease: "none" }, 0.4);
    walkCycle(tl, q(".walker"), 0.4, 5.3, 0.36, false);
    loop(
      q(".hoer"),
      { rotation: 9, transformOrigin: "50% 100%" },
      0.6,
      0.3,
      beat(1),
    );
    tl.to(q(".runner"), { x: 64, duration: 4.6, ease: "none" }, 0.6);
    walkCycle(tl, q(".runner"), 0.6, 5.2, 0.22);
    tl.to(q(".ball-run"), { x: 64, duration: 4.6, ease: "none" }, 0.6);
    loop(
      q(".ball-run-bounce"),
      { y: -9, ease: "power1.out" },
      0.36,
      0.6,
      beat(1),
    );
    tl.to(q(".birds"), { x: 70, duration: beat(1), ease: "none" }, 0);
    loop(
      q(".wing"),
      { scaleY: 0.3, transformOrigin: "50% 100%" },
      0.22,
      0,
      beat(1),
    );

    // 2 · Bajo techo.
    drift(tl, q(".par-far"), -6, 0, beat(1));
    drift(tl, q(".par-mid"), -12, 0, beat(1));
    drift(tl, q(".par-near"), -18, 0, beat(1));
    drift(tl, q(".par-front"), -30, 0, beat(1));
    loop(
      q(".foliage-sway"),
      { rotation: 3, transformOrigin: "50% 100%" },
      1.6,
      0,
      beat(1),
    );
    breathe(tl, q(".hoer"), 0.3, beat(1));

    tl.to(
      q(".act-field"),
      {
        opacity: 0,
        scale: 1.06,
        svgOrigin: "160 90",
        duration: 0.7,
        ease: "power2.in",
      },
      beat(1),
    );
    tl.fromTo(
      q(".act-office"),
      { opacity: 0, scale: 0.96, svgOrigin: "160 90" },
      {
        opacity: 1,
        scale: 1,
        svgOrigin: "160 90",
        duration: 0.8,
        ease: "power2.out",
      },
      beat(1, 0.1),
    );
    tl.fromTo(
      q(".ceiling"),
      { y: -52 },
      { y: 0, duration: 1.2, ease: "power3.out" },
      beat(1, 0.3),
    );
    tl.to(
      q(".ceiling"),
      { y: 12, duration: 1.6, ease: "power2.inOut" },
      beat(1, 3),
    );
    tl.to(
      q(".hand-min"),
      {
        rotation: 360 * 6,
        svgOrigin: `${CLOCK.x} ${CLOCK.y}`,
        duration: 3.4,
        ease: "power1.inOut",
      },
      beat(1, 0.8),
    );
    tl.to(
      q(".hand-hour"),
      {
        rotation: 180,
        svgOrigin: `${CLOCK.x} ${CLOCK.y}`,
        duration: 3.4,
        ease: "power1.inOut",
      },
      beat(1, 0.8),
    );
    tl.from(
      q(".desk"),
      { opacity: 0, y: 10, stagger: 0.15, duration: 0.6 },
      beat(1, 0.4),
    );
    loop(q(".screen"), { opacity: 0.7 }, 0.5, beat(1, 1), beat(1, 4.2));
    tl.to(
      q(".worker"),
      { rotation: 6, transformOrigin: "50% 100%", duration: 1.6 },
      beat(1, 2.4),
    );
    tl.to(q(".office"), { opacity: 0, duration: 0.6 }, beat(1, 4.2));
    tl.to(q(".street"), { opacity: 1, duration: 0.6 }, beat(1, 4.2));
    tl.to(
      q(".car"),
      { x: 76, duration: 1.8, ease: "power2.inOut" },
      beat(1, 4.9),
    );
    tl.fromTo(
      q(".exhaust"),
      { x: 0, opacity: 0.7, scale: 0.5, transformOrigin: "50% 50%" },
      {
        x: -10,
        opacity: 0,
        scale: 1.6,
        duration: 0.7,
        stagger: 0.25,
        repeat: 2,
      },
      beat(1, 4.9),
    );
    tl.fromTo(
      q(".ghost"),
      { opacity: 0 },
      { opacity: 0.5, duration: 0.5 },
      beat(1, 5.4),
    );
    tl.to(q(".ghost"), { x: 60, duration: 1.4, ease: "none" }, beat(1, 5.4));
    walkCycle(tl, q(".ghost"), beat(1, 5.4), beat(2), 0.34);

    // 3 · El barrio.
    tl.to(
      q(".act-office"),
      {
        opacity: 0,
        scale: 1.06,
        svgOrigin: "160 90",
        duration: 0.7,
        ease: "power2.in",
      },
      beat(2),
    );
    tl.fromTo(
      q(".act-hood"),
      { opacity: 0, scale: 0.96, svgOrigin: "160 90" },
      {
        opacity: 1,
        scale: 1,
        svgOrigin: "160 90",
        duration: 0.8,
        ease: "power2.out",
      },
      beat(2, 0.1),
    );
    drift(tl, q(".hood-far"), -8, beat(2), duration);
    drift(tl, q(".hood-front"), -22, beat(2), duration);
    loop(
      q(".hood-sway"),
      { rotation: 3, transformOrigin: "50% 100%" },
      1.5,
      beat(2),
      duration,
    );
    breathe(tl, q(".kicker"), beat(2, 0.6), duration);
    tl.fromTo(
      q(".trail"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.4, ease: "power2.out" },
      beat(2, 0.2),
    );
    tl.from(
      q(".hood-tree"),
      {
        scale: 0,
        stagger: 0.14,
        duration: 0.6,
        ease: "back.out(2.2)",
        transformOrigin: "50% 100%",
      },
      beat(2, 0.5),
    );
    const trail = q(".trail")[0] as SVGPathElement;
    tl.fromTo(
      q(".jogger"),
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      beat(2, 0.8),
    );
    tl.to(
      q(".jogger"),
      {
        motionPath: {
          path: trail,
          align: trail,
          alignOrigin: [0.5, 1],
          start: 0.16,
          end: 0.72,
        },
        duration: duration - beat(2, 0.8),
        ease: "none",
      },
      beat(2, 0.8),
    );
    walkCycle(tl, q(".jogger"), beat(2, 0.8), duration, 0.24);
    tl.fromTo(
      q(".stroller"),
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      beat(2, 1.2),
    );
    tl.to(
      q(".stroller"),
      {
        motionPath: {
          path: trail,
          align: trail,
          alignOrigin: [0.5, 1],
          start: 0.04,
          end: 0.34,
        },
        duration: duration - beat(2, 1.2),
        ease: "none",
      },
      beat(2, 1.2),
    );
    walkCycle(tl, q(".stroller"), beat(2, 1.2), duration, 0.36);
    tl.from(q(".court"), { opacity: 0, y: 8, duration: 0.6 }, beat(2, 0.6));
    loop(
      q(".kicker .leg-f"),
      { rotation: -40, transformOrigin: "50% 0%" },
      0.3,
      beat(2, 1.2),
      duration,
    );
    loop(
      q(".ball-kick"),
      { x: 14, ease: "power2.out" },
      0.6,
      beat(2, 1.2),
      duration,
    );
    loop(
      q(".ball-kick-bounce"),
      { y: -12, ease: "power1.out" },
      0.3,
      beat(2, 1.2),
      duration,
    );
    tl.fromTo(
      q(".leaf"),
      { y: -20, opacity: 0, rotation: 0, transformOrigin: "50% 50%" },
      {
        y: 36,
        x: 10,
        opacity: 1,
        rotation: 220,
        duration: 2.8,
        stagger: 0.3,
        ease: "sine.inOut",
      },
      beat(2, 1),
    );
  });

  return (
    <SceneSvg svgRef={svgRef}>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id={id("wall")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={id("day")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#f0f9ff" />
        </linearGradient>
      </defs>

      <g className="scene">
        <g className="camera">
          {/* 1 · El campo. */}
          <g className="act-field">
            <rect width={320} height={180} fill={`url(#${id("sky")})`} />
            <Glow cx={58} cy={34} r={40} color="#fde047" opacity={0.75} />
            <circle cx={58} cy={34} r={12} fill="#fde047" />
            <Cloud x={150} y={30} className="cloud-a" />
            <Cloud x={250} y={44} scale={0.75} className="cloud-b" />
            <g className="birds">
              {[
                [96, 44],
                [110, 52],
                [84, 54],
              ].map(([x, y]) => (
                <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                  <path
                    className="wing"
                    d="M-5 0 Q-2.5 -3 0 0 Q2.5 -3 5 0"
                    stroke="#1e293b"
                    strokeWidth={1.2}
                    fill="none"
                  />
                </g>
              ))}
            </g>
            <g className="par-far">
              <path
                d="M-30 112 L40 82 L70 100 L110 66 L150 98 L190 72 L230 96 L270 76 L320 104 L350 92 V180 H-30 Z"
                fill="#93c5fd"
              />
            </g>
            <g className="par-mid">
              <path
                d="M-30 126 Q80 104 160 122 T360 116 V180 H-30 Z"
                fill="#86efac"
              />
            </g>
            <g className="par-near">
              <path d="M-30 140 Q160 130 350 140 V180 H-30 Z" fill="#4ade80" />
              <path d="M-30 158 Q160 150 350 158 V180 H-30 Z" fill="#22c55e" />
              {[196, 210, 224, 238, 252, 266].map((x) => (
                <path
                  key={x}
                  d={`M${x} 142 L${x + 18} 176`}
                  stroke="#16a34a"
                  strokeWidth={1.4}
                />
              ))}
              <path
                d="M20 178 Q120 150 200 152 T320 146"
                stroke="#fde68a"
                strokeWidth={7}
                strokeLinecap="round"
                fill="none"
              />
              <g transform="translate(150 140) scale(0.72)">
                <g className="runner">
                  <Person look={CAST.nino} />
                </g>
              </g>
              <g className="ball-run">
                <g className="ball-run-bounce">
                  <circle
                    cx={166}
                    cy={136}
                    r={3}
                    fill="#fff"
                    stroke="#1e293b"
                    strokeWidth={0.8}
                  />
                </g>
              </g>
              <g transform="translate(232 150)">
                <g className="hoer">
                  <Person look={CAST.mar} arms="carry" />
                  <path
                    d="M11 -32 L22 -3"
                    stroke="#78350f"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                  <path d="M19 -3 h8 l-1 3 h-6 z" fill="#64748b" />
                </g>
              </g>
              <g transform="translate(64 156)">
                <g className="walker">
                  <Person look={CAST.leo} arms="carry" holding="basket" />
                </g>
              </g>
            </g>
            <g className="par-front">
              <Foliage
                x={12}
                y={188}
                color="#166534"
                className="foliage-sway"
              />
              <Foliage
                x={310}
                y={190}
                flip
                scale={0.85}
                color="#15803d"
                className="foliage-sway"
              />
            </g>
          </g>

          {/* 2 · Bajo techo, y dos cuadras en coche. */}
          <g className="act-office" opacity={0}>
            <g className="office">
              <rect width={320} height={180} fill={`url(#${id("wall")})`} />
              <rect y={150} width={320} height={30} fill="#94a3b8" />
              <g>
                <circle
                  cx={CLOCK.x}
                  cy={CLOCK.y}
                  r={12}
                  fill="#fff"
                  stroke="#334155"
                  strokeWidth={1.6}
                />
                {CLOCK_TICKS.map((degrees) => (
                  <line
                    key={degrees}
                    x1={CLOCK.x}
                    y1={CLOCK.y - 10}
                    x2={CLOCK.x}
                    y2={CLOCK.y - 8.4}
                    stroke="#334155"
                    strokeWidth={0.8}
                    transform={`rotate(${degrees} ${CLOCK.x} ${CLOCK.y})`}
                  />
                ))}
                <line
                  className="hand-hour"
                  x1={CLOCK.x}
                  y1={CLOCK.y}
                  x2={CLOCK.x + 5}
                  y2={CLOCK.y}
                  stroke="#0f172a"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
                <line
                  className="hand-min"
                  x1={CLOCK.x}
                  y1={CLOCK.y}
                  x2={CLOCK.x}
                  y2={CLOCK.y - 8}
                  stroke="#ef4444"
                  strokeWidth={1.1}
                  strokeLinecap="round"
                />
              </g>
              {DESKS.map(({ x, look }) => (
                <g key={x} className="desk">
                  <Glow
                    cx={x + 10}
                    cy={116}
                    r={22}
                    color="#60a5fa"
                    opacity={0.35}
                  />
                  <rect
                    x={x - 2}
                    y={106}
                    width={24}
                    height={16}
                    rx={1.6}
                    fill="#1e293b"
                  />
                  <rect
                    className="screen"
                    x={x}
                    y={108}
                    width={20}
                    height={12}
                    rx={1}
                    fill="#93c5fd"
                  />
                  <rect x={x + 8} y={122} width={4} height={6} fill="#475569" />
                  <rect
                    x={x - 24}
                    y={128}
                    width={52}
                    height={4}
                    rx={1}
                    fill="#64748b"
                  />
                  <rect
                    x={x + 22}
                    y={132}
                    width={3}
                    height={18}
                    fill="#64748b"
                  />
                  <rect
                    x={x - 21}
                    y={137}
                    width={15}
                    height={3}
                    rx={1}
                    fill="#475569"
                  />
                  <rect
                    x={x - 22}
                    y={116}
                    width={3}
                    height={24}
                    rx={1}
                    fill="#475569"
                  />
                  <line
                    x1={x - 14}
                    y1={140}
                    x2={x - 14}
                    y2={150}
                    stroke="#475569"
                    strokeWidth={2}
                  />
                  <g transform={`translate(${x - 12} 150)`}>
                    <g className="worker">
                      <Person look={look} pose="chair" arms="carry" />
                    </g>
                  </g>
                </g>
              ))}
              <rect
                className="ceiling"
                y={0}
                width={320}
                height={46}
                fill="#334155"
              />
              {[70, 160, 250].map((x) => (
                <rect
                  key={x}
                  x={x - 18}
                  y={40}
                  width={36}
                  height={3}
                  rx={1.5}
                  fill="#e2e8f0"
                  className="ceiling"
                />
              ))}
            </g>
            <g className="street" opacity={0}>
              <rect width={320} height={180} fill={`url(#${id("day")})`} />
              <rect y={134} width={320} height={6} fill="#cbd5e1" />
              <rect y={140} width={320} height={24} fill="#475569" />
              <path
                d="M0 152 H320"
                stroke="#e2e8f0"
                strokeWidth={1.4}
                strokeDasharray="8 7"
              />
              <rect y={164} width={320} height={16} fill="#94a3b8" />
              <path d="M80 134 V112 L96 100 L112 112 V134 Z" fill="#fca5a5" />
              <rect x={92} y={120} width={8} height={14} fill="#7f1d1d" />
              <rect x={188} y={104} width={40} height={30} fill="#fde68a" />
              <path d="M184 104 H232 L228 96 H188 Z" fill="#16a34a" />
              <path
                d="M192 96 V104 M200 96 V104 M208 96 V104 M216 96 V104 M224 96 V104"
                stroke="#fff"
                strokeWidth={2}
              />
              <rect x={194} y={112} width={12} height={22} fill="#92400e" />
              <path
                d="M112 90 H188 M112 86 V94 M150 86 V94 M188 86 V94"
                stroke="#1e293b"
                strokeWidth={1.2}
                strokeDasharray="3 2"
              />
              <g className="car">
                <rect
                  x={96}
                  y={142}
                  width={26}
                  height={9}
                  rx={3}
                  fill="#f43f5e"
                />
                <path d="M101 142 L105 135 H115 L119 142 Z" fill="#fb7185" />
                <rect
                  x={106}
                  y={137}
                  width={8}
                  height={4}
                  rx={1}
                  fill="#e0f2fe"
                />
                <circle cx={102} cy={152} r={3} fill="#0f172a" />
                <circle cx={116} cy={152} r={3} fill="#0f172a" />
                {[0, 1, 2].map((index) => (
                  <circle
                    key={index}
                    className="exhaust"
                    cx={93}
                    cy={149}
                    r={2.4}
                    fill="#cbd5e1"
                    opacity={0}
                  />
                ))}
              </g>
              <g transform="translate(118 134) scale(0.7)">
                <g className="ghost" opacity={0}>
                  <Person look={CAST.ana} />
                </g>
              </g>
            </g>
          </g>

          {/* 3 · El barrio. */}
          <g className="act-hood" opacity={0}>
            <rect width={320} height={180} fill={`url(#${id("day")})`} />
            <Glow cx={250} cy={36} r={46} color="#fde047" opacity={0.7} />
            <circle cx={250} cy={36} r={12} fill="#fde047" />
            <g className="hood-far">
              <path
                d="M-30 120 Q90 96 170 114 T370 104 V180 H-30 Z"
                fill="#bbf7d0"
              />
            </g>
            <path
              d="M0 140 Q120 120 220 132 T320 126 V180 H0 Z"
              fill="#86efac"
            />
            <path d="M0 160 Q160 146 320 158 V180 H0 Z" fill="#4ade80" />
            <path
              className="trail"
              d={TRAIL}
              pathLength={1}
              strokeDasharray={1}
              stroke="#fde68a"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
            <Tree x={70} y={152} className="hood-tree" />
            <Tree
              x={120}
              y={134}
              size={0.8}
              color="#15803d"
              className="hood-tree"
            />
            <Tree x={206} y={122} size={0.75} className="hood-tree" />
            <Tree
              x={48}
              y={120}
              size={0.6}
              color="#22c55e"
              className="hood-tree"
            />
            <g className="court">
              <rect
                x={226}
                y={132}
                width={62}
                height={18}
                rx={2}
                fill="#16a34a"
              />
              <path
                d="M257 132 V150 M226 141 H288"
                stroke="#fff"
                strokeOpacity={0.7}
                strokeWidth={0.8}
              />
              <path
                d="M270 132 V116 H286 V132"
                stroke="#fff"
                strokeWidth={1.6}
                fill="none"
              />
              <path
                d="M270 116 L286 116 M272 120 H284 M272 124 H284 M272 128 H284"
                stroke="#fff"
                strokeOpacity={0.4}
                strokeWidth={0.6}
              />
              <g transform="translate(244 148) scale(0.72)">
                <g className="kicker">
                  <Person look={CAST.nino} />
                </g>
              </g>
              <g className="ball-kick">
                <g className="ball-kick-bounce">
                  <circle
                    cx={254}
                    cy={144}
                    r={3}
                    fill="#fff"
                    stroke="#1e293b"
                    strokeWidth={0.8}
                  />
                </g>
              </g>
            </g>
            <g className="stroller" opacity={0}>
              <g transform="scale(0.85)">
                <Person look={CAST.ana} />
              </g>
            </g>
            <g className="jogger" opacity={0}>
              <g transform="scale(0.9)">
                <Person look={CAST.tono} />
              </g>
            </g>
            {LEAVES.map(([x, y]) => (
              <path
                key={`${x}-${y}`}
                className="leaf"
                d={`M${x} ${y} q4 -4 8 0 q-4 4 -8 0 z`}
                fill="#4ade80"
                opacity={0}
              />
            ))}
            <g className="hood-front">
              <Foliage x={10} y={190} color="#14532d" className="hood-sway" />
              <Foliage
                x={312}
                y={192}
                flip
                scale={0.8}
                color="#166534"
                className="hood-sway"
              />
            </g>
          </g>
        </g>
      </g>
    </SceneSvg>
  );
}
