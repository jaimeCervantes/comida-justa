"use client";
import { useRef } from "react";
import {
  breathe,
  CAST,
  drift,
  Foliage,
  Glow,
  type Look,
  Person,
  SceneSvg,
  Stars,
  seededRandom,
  Tree,
  useSvgIds,
  walkCycle,
} from "./kit";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

/** La red: nodos fijos y enlaces entre vecinos cercanos, el mismo dibujo en cada reproducción. */
const random = seededRandom(2026);
const NODES = Array.from({ length: 26 }, () => ({
  x: 48 + random() * 224,
  y: 24 + random() * 128,
}));
const EDGES = NODES.flatMap((a, i) =>
  NODES.slice(i + 1)
    .filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < 54)
    .map((b) => ({ a, b })),
);

/** El edificio: nueve ventanas, cada una con alguien solo frente a su pantalla. */
const WINDOWS = Array.from({ length: 9 }, (_, index) => ({
  x: 86 + (index % 3) * 52,
  y: 34 + Math.floor(index / 3) * 36,
}));

const TRIBE: readonly {
  x: number;
  y: number;
  scale: number;
  flip: boolean;
  look: Look;
}[] = [
  { x: 132, y: 146, scale: 0.8, flip: false, look: CAST.sol },
  { x: 190, y: 146, scale: 0.8, flip: true, look: CAST.tono },
  { x: 114, y: 160, scale: 1, flip: false, look: CAST.abuela },
  { x: 206, y: 160, scale: 1, flip: true, look: CAST.mar },
  { x: 96, y: 162, scale: 0.72, flip: false, look: CAST.nino },
];

const NEIGHBOURS: readonly { from: number; to: number; look: Look }[] = [
  { from: 44, to: 104, look: CAST.leo },
  { from: 70, to: 128, look: CAST.abuela },
  { from: 276, to: 196, look: CAST.sol },
  { from: 300, to: 220, look: CAST.tono },
];

const SPARKS = [-8, -3, 2, 6, 10, -12] as const;

/**
 * Mente y espíritu, en tres actos.
 *
 * 1. La tribu: un círculo alrededor del fuego bajo una aurora, y el silencio de la noche.
 * 2. Conectados con miles: una red de nodos se teje en el cielo… y luego, un edificio donde cada
 *    ventana tiene a alguien solo frente a su pantalla.
 * 3. La presencia: alguien respira en el centro de un patio y los vecinos salen a su encuentro.
 */
export default function MindSpiritScene(props: SceneProps) {
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

    // 1 · La tribu.
    loop(
      q(".aurora-a"),
      { x: 20, scaleY: 1.2, transformOrigin: "50% 50%" },
      2.6,
      0,
      beat(1),
    );
    loop(
      q(".aurora-b"),
      { x: -16, scaleY: 0.85, transformOrigin: "50% 50%" },
      3.1,
      0,
      beat(1),
    );
    loop(q(".tribe .star"), { opacity: 0.35 }, 1.3, 0, beat(1));
    tl.from(
      q(".elder"),
      { opacity: 0, y: 6, stagger: 0.15, duration: 0.7 },
      0.3,
    );
    loop(
      q(".elder-sway"),
      { rotation: 2.5, transformOrigin: "50% 100%" },
      1.4,
      1.2,
      beat(1),
    );
    loop(
      q(".tribe-flame"),
      { scaleY: 1.18, scaleX: 0.9, transformOrigin: "50% 100%" },
      0.4,
      0,
      beat(1),
    );
    loop(
      q(".tribe-fire-glow"),
      { scale: 1.08, transformOrigin: "50% 50%" },
      0.9,
      0,
      beat(1),
    );
    tl.fromTo(
      q(".spark"),
      { y: 0, opacity: 1 },
      {
        y: -46,
        opacity: 0,
        duration: 1.6,
        stagger: 0.28,
        repeat: 2,
        ease: "sine.out",
      },
      0.4,
    );

    // 2 · Conectados con miles… y solos.
    drift(tl, q(".par-far"), -6, 0, beat(1));
    drift(tl, q(".par-front"), -24, 0, beat(1));
    loop(
      q(".night-sway"),
      { rotation: 3, transformOrigin: "50% 100%" },
      1.8,
      0,
      beat(1),
    );
    breathe(tl, q(".elder"), 1, beat(1), 2.2);

    tl.to(
      q(".act-tribe"),
      {
        opacity: 0,
        scale: 1.06,
        svgOrigin: "160 90",
        duration: 0.8,
        ease: "power2.in",
      },
      beat(1),
    );
    tl.fromTo(
      q(".act-network"),
      { opacity: 0, scale: 0.96, svgOrigin: "160 90" },
      {
        opacity: 1,
        scale: 1,
        svgOrigin: "160 90",
        duration: 0.7,
        ease: "power2.out",
      },
      beat(1, 0.1),
    );
    tl.from(
      q(".node"),
      {
        scale: 0,
        stagger: 0.04,
        duration: 0.4,
        ease: "back.out(3)",
        transformOrigin: "50% 50%",
      },
      beat(1, 0.3),
    );
    tl.fromTo(
      q(".edge"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, stagger: 0.02, duration: 0.6 },
      beat(1, 0.7),
    );
    loop(
      q(".node-glow"),
      { scale: 1.4, opacity: 0.3, transformOrigin: "50% 50%" },
      0.7,
      beat(1, 1.4),
      beat(1, 3),
    );
    tl.to(
      q(".act-network"),
      {
        opacity: 0,
        scale: 0.6,
        svgOrigin: "160 90",
        duration: 0.8,
        ease: "power2.in",
      },
      beat(1, 2.5),
    );
    tl.to(q(".act-building"), { opacity: 1, duration: 0.8 }, beat(1, 2.8));
    tl.to(
      q(".lit"),
      { opacity: 1, stagger: 0.18, duration: 0.3 },
      beat(1, 3.1),
    );
    loop(q(".lit-glow"), { opacity: 0.55 }, 0.8, beat(1, 4.8), beat(2));

    // 3 · La presencia.
    tl.to(
      q(".act-building"),
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
      q(".act-courtyard"),
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
    drift(tl, q(".yard-front"), -20, beat(2), duration);
    loop(
      q(".yard-sway"),
      { rotation: 3, transformOrigin: "50% 100%" },
      1.6,
      beat(2),
      duration,
    );
    breathe(tl, q(".center-person"), beat(2, 0.8), duration, 2.4);
    breathe(tl, q(".neighbour"), beat(2, 2.9), duration);
    tl.from(
      q(".center-person"),
      { opacity: 0, y: 8, duration: 0.8 },
      beat(2, 0.2),
    );
    tl.fromTo(
      q(".ripple"),
      { scale: 0.3, opacity: 0.7, svgOrigin: "160 112" },
      {
        scale: 1.8,
        opacity: 0,
        svgOrigin: "160 112",
        duration: 2.4,
        stagger: 0.8,
        repeat: 1,
        ease: "sine.out",
      },
      beat(2, 0.4),
    );
    NEIGHBOURS.forEach((neighbour, index) => {
      tl.to(
        q(`.neighbour-${index}`),
        { x: neighbour.to - neighbour.from, duration: 2.2, ease: "power1.out" },
        beat(2, 0.5 + index * 0.15),
      );
    });
    walkCycle(tl, q(".neighbour"), beat(2, 0.5), beat(2, 2.8), 0.34);
    loop(
      q(".waver .arm-f"),
      { rotation: -18, transformOrigin: "10% 100%" },
      0.3,
      beat(2, 2.8),
      duration,
    );
    tl.fromTo(
      q(".float-heart"),
      { y: 0, opacity: 0, scale: 0.4, transformOrigin: "50% 50%" },
      {
        y: -30,
        opacity: 1,
        scale: 1,
        duration: 1.4,
        stagger: 0.3,
        ease: "sine.out",
      },
      beat(2, 2.6),
    );
  });

  return (
    <SceneSvg svgRef={svgRef}>
      <defs>
        <linearGradient id={id("night")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1026" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id={id("aurora")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity={0} />
          <stop offset="0.5" stopColor="#2dd4bf" stopOpacity={0.55} />
          <stop offset="1" stopColor="#a78bfa" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id("dusk")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fbcfe8" />
        </linearGradient>
        <linearGradient id={id("facade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#334155" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      <g className="scene">
        <g className="camera">
          {/* 1 · La tribu. */}
          <g className="act-tribe">
            <rect width={320} height={180} fill={`url(#${id("night")})`} />
            <g className="tribe">
              <Stars />
            </g>
            <path
              className="aurora-a"
              d="M-20 60 C40 20 100 70 160 40 S280 30 340 56 L340 72 C280 48 220 78 160 58 S40 40 -20 78 Z"
              fill={`url(#${id("aurora")})`}
            />
            <path
              className="aurora-b"
              d="M-20 44 C60 70 120 24 190 50 S300 64 340 36 L340 48 C300 76 200 62 150 70 S40 58 -20 58 Z"
              fill={`url(#${id("aurora")})`}
              opacity={0.7}
            />
            <g className="par-far">
              <path
                d="M-30 128 L50 92 L90 116 L140 80 L190 112 L240 86 L290 110 L320 98 L350 108 V180 H-30 Z"
                fill="#111827"
              />
            </g>
            <path d="M0 148 Q160 136 320 148 V180 H0 Z" fill="#1f2937" />
            <g className="tribe-fire-glow">
              <Glow cx={160} cy={148} r={70} color="#fb923c" opacity={0.7} />
            </g>
            {TRIBE.map((member) => (
              <g
                key={`${member.x}-${member.y}`}
                transform={`translate(${member.x} ${member.y}) scale(${member.flip ? -member.scale : member.scale} ${member.scale})`}
              >
                <g className="elder">
                  <g className="elder-sway">
                    <Person look={member.look} pose="sit" />
                  </g>
                </g>
              </g>
            ))}
            <g transform="translate(160 158)">
              <rect
                x={-12}
                y={-3}
                width={24}
                height={4}
                rx={2}
                fill="#78350f"
                transform="rotate(10)"
              />
              <rect
                x={-12}
                y={-3}
                width={24}
                height={4}
                rx={2}
                fill="#92400e"
                transform="rotate(-10)"
              />
              <path
                className="tribe-flame"
                d="M0 -26 C9 -15 10 -6 0 -1 C-10 -6 -9 -15 0 -26 Z"
                fill="#f97316"
              />
              <path
                className="tribe-flame"
                d="M0 -16 C5 -10 5 -5 0 -2 C-5 -5 -5 -10 0 -16 Z"
                fill="#fde047"
              />
              {SPARKS.map((x) => (
                <circle
                  key={x}
                  className="spark"
                  cx={x}
                  cy={-22}
                  r={0.9}
                  fill="#fde68a"
                  opacity={0}
                />
              ))}
            </g>
            <g className="par-front">
              <Foliage x={14} y={190} color="#0b1220" className="night-sway" />
              <Foliage
                x={308}
                y={192}
                flip
                scale={0.9}
                color="#0b1220"
                className="night-sway"
              />
            </g>
          </g>

          {/* 2 · La red. */}
          <g className="act-network" opacity={0}>
            <rect width={320} height={180} fill="#0b1026" />
            <Glow cx={160} cy={90} r={140} color="#0ea5e9" opacity={0.25} />
            {EDGES.map(({ a, b }) => (
              <line
                key={`${a.x}-${b.x}-${a.y}-${b.y}`}
                className="edge"
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                pathLength={1}
                strokeDasharray={1}
                stroke="#38bdf8"
                strokeOpacity={0.55}
                strokeWidth={0.7}
              />
            ))}
            {NODES.map((node) => (
              <g key={`${node.x}-${node.y}`} className="node">
                <circle
                  className="node-glow"
                  cx={node.x}
                  cy={node.y}
                  r={4}
                  fill="#38bdf8"
                  opacity={0.35}
                />
                <circle cx={node.x} cy={node.y} r={1.8} fill="#e0f2fe" />
              </g>
            ))}
          </g>

          {/* 2 · El edificio: cada quien, solo, en su ventana. */}
          <g className="act-building" opacity={0}>
            <rect width={320} height={180} fill="#0f172a" />
            <Stars />
            <rect
              x={70}
              y={20}
              width={180}
              height={160}
              rx={4}
              fill={`url(#${id("facade")})`}
            />
            {WINDOWS.map(({ x, y }) => (
              <g key={`${x}-${y}`}>
                <rect
                  x={x}
                  y={y}
                  width={44}
                  height={28}
                  rx={2}
                  fill="#0b1026"
                />
                <g className="lit" opacity={0}>
                  <rect
                    x={x}
                    y={y}
                    width={44}
                    height={28}
                    rx={2}
                    fill="#1e3a8a"
                    opacity={0.55}
                  />
                  <g className="lit-glow">
                    <Glow
                      cx={x + 26}
                      cy={y + 18}
                      r={16}
                      color="#60a5fa"
                      opacity={0.8}
                    />
                  </g>
                  <circle cx={x + 20} cy={y + 15} r={4} fill="#0f172a" />
                  <path
                    d={`M${x + 13} ${y + 28} Q${x + 13} ${y + 20} ${x + 20} ${y + 20} Q${x + 27} ${y + 20} ${x + 27} ${y + 28} Z`}
                    fill="#0f172a"
                  />
                  <rect
                    x={x + 25}
                    y={y + 15}
                    width={4}
                    height={6}
                    rx={1}
                    fill="#bfdbfe"
                  />
                </g>
                <rect
                  x={x}
                  y={y}
                  width={44}
                  height={28}
                  rx={2}
                  fill="none"
                  stroke="#475569"
                  strokeWidth={1.4}
                />
              </g>
            ))}
            {[92, 144, 196].map((x) => (
              <g key={x}>
                <rect
                  x={x}
                  y={144}
                  width={20}
                  height={36}
                  rx={2}
                  fill="#475569"
                />
                <circle cx={x + 16} cy={163} r={1.2} fill="#cbd5e1" />
              </g>
            ))}
          </g>

          {/* 3 · El patio. */}
          <g className="act-courtyard" opacity={0}>
            <rect width={320} height={180} fill={`url(#${id("dusk")})`} />
            <Glow cx={160} cy={110} r={120} color="#fb923c" opacity={0.35} />
            <path d="M0 132 Q160 118 320 132 V180 H0 Z" fill="#bbf7d0" />
            <path d="M0 150 Q160 140 320 150 V180 H0 Z" fill="#86efac" />
            <Tree x={52} y={140} size={1.1} color="#14b8a6" />
            <Tree x={270} y={138} size={1} color="#0d9488" />
            {[0, 1, 2].map((index) => (
              <circle
                key={index}
                className="ripple"
                cx={160}
                cy={112}
                r={26}
                fill="none"
                stroke="#0284c7"
                strokeWidth={1.6}
                opacity={0}
              />
            ))}
            <g transform="translate(160 150)">
              <g className="center-person">
                <Person look={CAST.ana} />
              </g>
            </g>
            {NEIGHBOURS.map((neighbour, index) => (
              <g
                key={neighbour.from}
                transform={`translate(${neighbour.from} 152)`}
              >
                <g className={`neighbour neighbour-${index}`}>
                  <g
                    className={index === 2 ? "waver" : undefined}
                    transform={
                      neighbour.to < neighbour.from ? "scale(-1 1)" : undefined
                    }
                  >
                    <Person
                      look={neighbour.look}
                      arms={index === 2 ? "wave" : "down"}
                    />
                  </g>
                </g>
              </g>
            ))}
            {[140, 160, 180].map((x) => (
              <g key={x} transform={`translate(${x} 78)`}>
                <path
                  className="float-heart"
                  d="M0 5 C-7 0 -6 -6 -2 -6 C-1 -6 0 -5 0 -4 C0 -5 1 -6 2 -6 C6 -6 7 0 0 5 Z"
                  fill="#f43f5e"
                  opacity={0}
                />
              </g>
            ))}
            <g className="yard-front">
              <Foliage x={10} y={190} color="#115e59" className="yard-sway" />
              <Foliage
                x={312}
                y={192}
                flip
                scale={0.85}
                color="#134e4a"
                className="yard-sway"
              />
            </g>
          </g>
        </g>
      </g>
    </SceneSvg>
  );
}
