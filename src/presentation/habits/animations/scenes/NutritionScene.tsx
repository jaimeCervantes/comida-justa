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
  useSvgIds,
} from "./kit";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

/** La milpa: maíz, frijol que trepa y calabaza al pie. */
const STALKS = [112, 130, 148, 166, 184] as const;
const SUN_RAYS = Array.from({ length: 12 }, (_, index) => index * 30);
const BOXES = Array.from({ length: 9 }, (_, index) => 30 + index * 36);
const ROLLERS = Array.from({ length: 14 }, (_, index) => 46 + index * 18);

/** Los frijoles del cuarto de proteína: posición y giro de cada uno. */
const BEANS = [
  [158, 111, -20],
  [164.5, 113, 15],
  [171, 110, -5],
  [161, 106.5, 30],
  [168, 106, -25],
  [175, 114, 10],
  [157, 115.5, 0],
  [164, 117.5, -15],
  [171, 117, 25],
] as const;

const ROUTE_AIR = "M114 70 Q160 2 206 58";
const ROUTE_SEA = "M112 96 Q160 128 210 92";

/**
 * Alimentación, en tres actos.
 *
 * 1. La milpa crece junto a la casa; la abuela y el nieto se saludan, y aparece un corazón: se
 *    conocía a quien sembraba.
 * 2. La cadena global: una banda de paquetes idénticos, un planeta cruzado por aviones y barcos, y
 *    un medidor de nutrientes que se vacía.
 * 3. El plato cercano: los ingredientes caen en su sitio, humea, y quien lo cultivó saluda desde
 *    unos metros.
 */
export default function NutritionScene(props: SceneProps) {
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

    // 1 · La milpa.
    tl.to(
      q(".rays"),
      { rotation: 90, svgOrigin: "262 38", duration: beat(1), ease: "none" },
      0,
    );
    loop(q(".cloud-a"), { x: 14 }, 3.4, 0, beat(1));
    loop(q(".cloud-b"), { x: -10 }, 3, 0, beat(1));
    tl.from(
      q(".stalk"),
      {
        scaleY: 0,
        stagger: 0.16,
        duration: 1,
        ease: "back.out(1.4)",
        transformOrigin: "50% 100%",
      },
      0.4,
    );
    tl.fromTo(
      q(".vine"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, stagger: 0.2, duration: 1.2 },
      1.2,
    );
    tl.from(
      q(".squash"),
      {
        scale: 0,
        stagger: 0.2,
        duration: 0.6,
        ease: "back.out(2.4)",
        transformOrigin: "50% 100%",
      },
      1.6,
    );
    loop(
      q(".stalk"),
      { rotation: 2, transformOrigin: "50% 100%" },
      1.6,
      2.2,
      beat(1),
    );
    tl.from(q(".family"), { opacity: 0, x: 12, duration: 0.8 }, 0.8);
    loop(
      q(".child-wave .arm-f"),
      { rotation: -18, transformOrigin: "10% 100%" },
      0.3,
      2.6,
      4.4,
    );
    tl.fromTo(
      q(".heart"),
      { opacity: 0, scale: 0, y: 6, transformOrigin: "50% 100%" },
      { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(2.6)" },
      3.8,
    );
    loop(q(".heart"), { y: -3 }, 0.8, 4.5, beat(1));

    drift(tl, q(".par-far"), -5, 0, beat(1));
    drift(tl, q(".par-mid"), -10, 0, beat(1));
    drift(tl, q(".par-near"), -16, 0, beat(1));
    drift(tl, q(".par-front"), -28, 0, beat(1));
    loop(
      q(".foliage-sway"),
      { rotation: 3, transformOrigin: "50% 100%" },
      1.7,
      0,
      beat(1),
    );
    breathe(tl, q(".family"), 1.6, beat(1));

    // 2 · La cadena global.
    tl.to(
      q(".act-milpa"),
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
      q(".act-industry"),
      { opacity: 0, scale: 0.96, svgOrigin: "160 90" },
      {
        opacity: 1,
        scale: 1,
        svgOrigin: "160 90",
        duration: 0.9,
        ease: "power2.out",
      },
      beat(1, 0.1),
    );
    tl.to(
      q(".roller"),
      {
        rotation: 360 * 6,
        transformOrigin: "50% 50%",
        duration: 8.5,
        ease: "none",
      },
      beat(1),
    );
    tl.to(
      q(".boxes"),
      { x: 36, duration: 0.8, ease: "none", repeat: 10 },
      beat(1),
    );
    loop(q(".press"), { y: 7 }, 0.4, beat(1), beat(2));
    tl.fromTo(
      q(".puff"),
      { y: 0, opacity: 0.8, scale: 0.6, transformOrigin: "50% 50%" },
      {
        y: -26,
        opacity: 0,
        scale: 1.6,
        duration: 1.8,
        stagger: 0.6,
        repeat: 4,
        ease: "sine.out",
      },
      beat(1, 0.2),
    );
    tl.from(
      q(".globe"),
      {
        opacity: 0,
        scale: 0.6,
        duration: 0.9,
        ease: "back.out(1.6)",
        transformOrigin: "50% 50%",
      },
      beat(1, 2.2),
    );
    loop(q(".lands"), { x: -8 }, 3.2, beat(1, 2.4), beat(2));
    tl.fromTo(
      q(".route"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, stagger: 0.4, duration: 1.2 },
      beat(1, 2.8),
    );
    const air = q(".route-air")[0] as SVGPathElement;
    const sea = q(".route-sea")[0] as SVGPathElement;
    tl.to(
      q(".plane"),
      {
        motionPath: {
          path: air,
          align: air,
          alignOrigin: [0.5, 0.5],
          autoRotate: true,
        },
        duration: 3.2,
        ease: "power1.inOut",
      },
      beat(1, 3.2),
    );
    tl.to(
      q(".ship"),
      {
        motionPath: {
          path: sea,
          align: sea,
          alignOrigin: [0.5, 0.5],
          autoRotate: true,
        },
        duration: 4.2,
        ease: "power1.inOut",
      },
      beat(1, 3.4),
    );
    tl.from(q(".vehicles"), { opacity: 0, duration: 0.4 }, beat(1, 3.2));
    tl.from(q(".gauge"), { opacity: 0, x: 8, duration: 0.6 }, beat(1, 5.2));
    tl.to(
      q(".gauge-fill"),
      {
        scaleY: 0.14,
        fill: "#ef4444",
        transformOrigin: "50% 100%",
        duration: 1.8,
        ease: "power2.inOut",
      },
      beat(1, 5.8),
    );
    tl.to(q(".gauge-leaf"), { fill: "#94a3b8", duration: 1.2 }, beat(1, 6.2));

    // 3 · El plato cercano.
    tl.to(
      q(".act-industry"),
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
      q(".act-plate"),
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
    breathe(tl, q(".farmer"), beat(2, 1.4), duration);
    tl.from(
      q(".plate"),
      {
        scale: 0.7,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.8)",
        transformOrigin: "50% 50%",
      },
      beat(2, 0.2),
    );
    tl.from(
      q(".food"),
      { y: -110, stagger: 0.12, duration: 0.8, ease: "bounce.out" },
      beat(2, 0.5),
    );
    tl.from(
      q(".food"),
      { opacity: 0, stagger: 0.12, duration: 0.2 },
      beat(2, 0.5),
    );
    tl.fromTo(
      q(".steam"),
      { strokeDashoffset: 1, opacity: 0.8 },
      {
        strokeDashoffset: -1,
        opacity: 0,
        duration: 1.8,
        stagger: 0.4,
        repeat: 1,
        ease: "sine.inOut",
      },
      beat(2, 1.8),
    );
    tl.from(q(".farmer"), { opacity: 0, x: 14, duration: 0.8 }, beat(2, 1.2));
    loop(
      q(".farmer-wave .arm-f"),
      { rotation: -18, transformOrigin: "10% 100%" },
      0.3,
      beat(2, 2),
      duration,
    );
    tl.fromTo(
      q(".near-path"),
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1 },
      beat(2, 2.2),
    );
    tl.fromTo(
      q(".pin"),
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "bounce.out" },
      beat(2, 2.4),
    );
    tl.from(
      q(".sparkle"),
      {
        scale: 0,
        stagger: 0.12,
        duration: 0.5,
        ease: "back.out(3)",
        transformOrigin: "50% 50%",
      },
      beat(2, 2.8),
    );
  });

  return (
    <SceneSvg svgRef={svgRef}>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#fff7ed" />
        </linearGradient>
        <linearGradient id={id("steel")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id={id("ocean")} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0369a1" />
        </radialGradient>
        <clipPath id={id("globe-clip")}>
          <circle cx={160} cy={62} r={30} />
        </clipPath>
        <linearGradient id={id("warm")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7ed" />
          <stop offset="1" stopColor="#fed7aa" />
        </linearGradient>
      </defs>

      <g className="scene">
        <g className="camera">
          {/* 1 · La milpa. */}
          <g className="act-milpa">
            <rect width={320} height={180} fill={`url(#${id("sky")})`} />
            <g className="rays">
              {SUN_RAYS.map((degrees) => (
                <rect
                  key={degrees}
                  x={260.5}
                  y={8}
                  width={3}
                  height={12}
                  rx={1.5}
                  fill="#fde68a"
                  transform={`rotate(${degrees} 262 38)`}
                />
              ))}
            </g>
            <Glow cx={262} cy={38} r={40} color="#fde047" opacity={0.7} />
            <circle cx={262} cy={38} r={13} fill="#fde047" />
            <Cloud x={82} y={30} className="cloud-a" />
            <Cloud x={200} y={22} scale={0.7} className="cloud-b" />
            <g className="par-far">
              <path
                d="M-30 118 Q70 98 150 112 T330 104 T380 106 V180 H-30 Z"
                fill="#bbf7d0"
              />
            </g>
            <g className="par-mid">
              <path
                d="M-30 130 Q90 116 180 128 T370 124 V180 H-30 Z"
                fill="#86efac"
              />
            </g>
            <g className="par-near">
              <path d="M-30 146 Q160 136 350 146 V180 H-30 Z" fill="#a16207" />
              <path d="M-30 152 Q160 144 350 152 V180 H-30 Z" fill="#854d0e" />
              <path
                d="M20 162 Q160 154 300 162 M10 170 Q160 162 310 170"
                stroke="#713f12"
                strokeWidth={1.2}
                fill="none"
              />

              {/* La casa, a unos pasos de la milpa. */}
              <rect
                x={46}
                y={114}
                width={38}
                height={34}
                rx={2}
                fill="#f4a261"
              />
              <path d="M42 116 L65 96 L88 116 Z" fill="#c2410c" />
              <rect
                x={60}
                y={128}
                width={9}
                height={20}
                rx={1}
                fill="#7c2d12"
              />
              <rect x={50} y={122} width={7} height={7} rx={1} fill="#fef3c7" />
              <path
                d="M70 150 Q92 156 110 150"
                stroke="#fde68a"
                strokeWidth={1.4}
                strokeDasharray="2 3"
                fill="none"
              />

              {STALKS.map((x, index) => (
                <g key={x}>
                  <g className="stalk">
                    <path
                      d={`M${x} 148 Q${x + 1} 120 ${x} 88`}
                      stroke="#15803d"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={`M${x} 128 q12 -6 17 -18 q-13 3 -17 12`}
                      fill="#22c55e"
                    />
                    <path
                      d={`M${x} 114 q-12 -6 -17 -18 q13 3 17 12`}
                      fill="#16a34a"
                    />
                    <path
                      d={`M${x} 100 q10 -5 14 -15 q-11 3 -14 10`}
                      fill="#4ade80"
                    />
                    <ellipse
                      cx={x + 3.5}
                      cy={108}
                      rx={2.8}
                      ry={6.5}
                      fill="#facc15"
                    />
                    <path
                      d={`M${x + 1.5} 112 q2 -8 4 -10 q-1 7 -1 12 z`}
                      fill="#84cc16"
                    />
                    <path
                      d={`M${x} 88 l-3 -6 M${x} 88 l0 -7 M${x} 88 l3 -6`}
                      stroke="#eab308"
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  </g>
                  {index % 2 === 0 && (
                    <path
                      className="vine"
                      d={`M${x - 1} 146 C${x + 6} 138 ${x - 6} 130 ${x + 1} 122 C${x + 7} 114 ${x - 5} 106 ${x + 1} 98`}
                      pathLength={1}
                      strokeDasharray={1}
                      stroke="#65a30d"
                      strokeWidth={1}
                      fill="none"
                    />
                  )}
                </g>
              ))}
              {[122, 158, 190].map((x) => (
                <g key={x} transform={`translate(${x} 149)`}>
                  <g className="squash">
                    <ellipse cx={0} cy={-4} rx={6.5} ry={4.8} fill="#f97316" />
                    <path
                      d="M-3 -8 Q-4 -4 -3 0 M0 -9 V1 M3 -8 Q4 -4 3 0"
                      stroke="#c2410c"
                      strokeWidth={0.7}
                      fill="none"
                    />
                    <path
                      d="M0 -9 q2 -3 5 -3"
                      stroke="#15803d"
                      strokeWidth={1.2}
                      fill="none"
                    />
                  </g>
                </g>
              ))}

              <g className="family">
                <g transform="translate(214 150)">
                  <Person look={CAST.abuela} arms="carry" holding="basket" />
                </g>
                <g transform="translate(246 150) scale(0.8)">
                  <g className="child-wave">
                    <Person look={CAST.nino} arms="wave" />
                  </g>
                </g>
              </g>
              <g transform="translate(230 92)">
                <path
                  className="heart"
                  d="M0 6 C-8 0 -7 -7 -2.5 -7 C-1 -7 0 -6 0 -5 C0 -6 1 -7 2.5 -7 C7 -7 8 0 0 6 Z"
                  fill="#f43f5e"
                />
              </g>
            </g>
            <g className="par-front">
              <Foliage
                x={14}
                y={188}
                color="#166534"
                className="foliage-sway"
              />
              <Foliage
                x={308}
                y={190}
                flip
                scale={0.85}
                color="#15803d"
                className="foliage-sway"
              />
            </g>
          </g>

          {/* 2 · La cadena global. */}
          <g className="act-industry" opacity={0}>
            <rect width={320} height={180} fill={`url(#${id("steel")})`} />
            <Glow cx={160} cy={62} r={80} color="#38bdf8" opacity={0.35} />
            {/* La fábrica. */}
            <rect x={18} y={82} width={44} height={50} rx={3} fill="#475569" />
            <rect x={44} y={56} width={10} height={30} fill="#334155" />
            <rect
              x={24}
              y={92}
              width={8}
              height={8}
              rx={1}
              fill="#fbbf24"
              opacity={0.8}
            />
            <rect
              x={38}
              y={92}
              width={8}
              height={8}
              rx={1}
              fill="#fbbf24"
              opacity={0.8}
            />
            <rect
              className="press"
              x={56}
              y={104}
              width={14}
              height={8}
              rx={2}
              fill="#1e293b"
            />
            {[0, 1, 2].map((index) => (
              <circle
                key={index}
                className="puff"
                cx={49}
                cy={52}
                r={5}
                fill="#e2e8f0"
                opacity={0}
              />
            ))}

            {/* La banda: paquetes idénticos, uno tras otro. */}
            <rect
              x={40}
              y={130}
              width={270}
              height={7}
              rx={3.5}
              fill="#334155"
            />
            {ROLLERS.map((x) => (
              <g key={x} className="roller">
                <circle cx={x} cy={133.5} r={2.6} fill="#64748b" />
                <path
                  d={`M${x - 2} 133.5 H${x + 2}`}
                  stroke="#cbd5e1"
                  strokeWidth={0.8}
                />
              </g>
            ))}
            <rect x={60} y={137} width={4} height={24} fill="#475569" />
            <rect x={280} y={137} width={4} height={24} fill="#475569" />
            <g className="boxes">
              {BOXES.map((x, index) => (
                <g key={x}>
                  <rect
                    x={x}
                    y={116}
                    width={20}
                    height={14}
                    rx={2.5}
                    fill={index % 2 === 0 ? "#f43f5e" : "#f59e0b"}
                  />
                  <rect
                    x={x + 3}
                    y={119}
                    width={14}
                    height={4}
                    rx={1}
                    fill="#fff"
                    opacity={0.85}
                  />
                  <path
                    d={`M${x + 2} 128 L${x + 9} 117`}
                    stroke="#fff"
                    strokeOpacity={0.45}
                    strokeWidth={1.6}
                  />
                </g>
              ))}
            </g>

            {/* El planeta y las rutas. */}
            <g className="globe">
              <circle cx={160} cy={62} r={30} fill={`url(#${id("ocean")})`} />
              <g clipPath={`url(#${id("globe-clip")})`}>
                <g className="lands" fill="#86efac">
                  <path d="M136 50 q8 -10 18 -4 q6 6 -2 12 q-8 4 -6 12 q-10 2 -12 -8 q-4 -6 2 -12 z" />
                  <path d="M166 44 q10 -4 16 4 q4 8 -4 10 q-6 0 -8 6 q-6 -2 -6 -10 q-2 -6 2 -10 z" />
                  <path d="M168 74 q8 -2 10 6 q0 8 -8 8 q-6 -4 -2 -14 z" />
                  <path d="M190 58 q6 -4 10 2 q2 6 -4 8 q-6 -2 -6 -10 z" />
                </g>
              </g>
              <circle cx={152} cy={52} r={10} fill="#fff" opacity={0.12} />
            </g>
            <path
              className="route route-air"
              d={ROUTE_AIR}
              pathLength={1}
              strokeDasharray={1}
              stroke="#fff"
              strokeWidth={1.3}
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="route route-sea"
              d={ROUTE_SEA}
              pathLength={1}
              strokeDasharray={1}
              stroke="#e0f2fe"
              strokeWidth={1.3}
              strokeLinecap="round"
              fill="none"
            />
            <g className="vehicles">
              <g className="plane">
                <path
                  d="M114 70 m-6 0 l10 -2 l3 -5 l2 0 l-1 6 l5 1 l1 -2 l2 0 l-1 3 l1 3 l-2 0 l-1 -2 l-5 1 l1 6 l-2 0 l-3 -5 l-10 -2 z"
                  fill="#fff"
                />
              </g>
              <g className="ship">
                <path d="M104 94 h16 l-3 5 h-10 z" fill="#1e293b" />
                <rect x={108} y={89} width={4} height={5} fill="#f43f5e" />
                <rect x={112.5} y={90} width={4} height={4} fill="#fbbf24" />
              </g>
            </g>

            {/* Pensada para durar, no para nutrir. */}
            <g className="gauge">
              <rect
                x={256}
                y={50}
                width={14}
                height={50}
                rx={7}
                fill="#fff"
                opacity={0.9}
              />
              <rect
                className="gauge-fill"
                x={259}
                y={54}
                width={8}
                height={42}
                rx={4}
                fill="#22c55e"
              />
              <g transform="translate(263 40)">
                <path
                  className="gauge-leaf"
                  d="M0 5 C-6 3 -6 -4 0 -7 C6 -4 6 3 0 5 Z"
                  fill="#22c55e"
                />
              </g>
            </g>
          </g>

          {/* 3 · El plato cercano. */}
          <g className="act-plate" opacity={0}>
            <rect width={320} height={180} fill={`url(#${id("warm")})`} />
            <Glow cx={150} cy={110} r={110} color="#fdba74" opacity={0.45} />
            <rect y={140} width={320} height={40} fill="#b45309" />
            <path
              d="M0 150 H320 M0 164 H320"
              stroke="#92400e"
              strokeWidth={1.2}
            />
            <g className="plate">
              <ellipse
                cx={150}
                cy={142}
                rx={68}
                ry={12}
                fill="#000"
                opacity={0.16}
              />
              <ellipse cx={150} cy={124} rx={66} ry={30} fill="#fff" />
              <ellipse
                cx={150}
                cy={123}
                rx={52}
                ry={22.5}
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth={1.2}
              />
              <path
                d="M96 116 Q150 88 204 116"
                stroke="#fff"
                strokeWidth={2}
                fill="none"
              />
              <g transform="translate(72 126) rotate(-8)">
                <rect
                  x={-1.6}
                  y={-2}
                  width={3.2}
                  height={26}
                  rx={1.6}
                  fill="#cbd5e1"
                />
                <rect
                  x={-4.6}
                  y={-4.4}
                  width={9.2}
                  height={4}
                  rx={2}
                  fill="#cbd5e1"
                />
                <path
                  d="M-3.6 -4 V-15 M-1.2 -4 V-15 M1.2 -4 V-15 M3.6 -4 V-15"
                  stroke="#cbd5e1"
                  strokeWidth={1.3}
                  strokeLinecap="round"
                />
              </g>
              <g transform="translate(228 126) rotate(8)">
                <rect
                  x={-1.6}
                  y={0}
                  width={3.2}
                  height={24}
                  rx={1.6}
                  fill="#94a3b8"
                />
                <path d="M-2 0 V-22 Q3.4 -18 2.4 0 Z" fill="#e2e8f0" />
              </g>
            </g>
            <g className="food">
              <path
                d="M108 132 C98 118 108 104 124 106 C136 108 138 122 130 131 C123 138 114 138 108 132 Z"
                fill="#65a30d"
              />
              <path
                d="M116 116 C112 107 123 100 134 104 C143 108 141 119 132 122 C125 124 119 122 116 116 Z"
                fill="#84cc16"
              />
              <path
                d="M113 130 Q120 118 130 110"
                stroke="#d9f99d"
                strokeWidth={1}
                fill="none"
              />
            </g>
            <g className="food">
              <rect
                x={124}
                y={124}
                width={3.4}
                height={9}
                rx={1.4}
                fill="#4d7c0f"
              />
              <circle cx={122.5} cy={122} r={5} fill="#15803d" />
              <circle cx={129.5} cy={121} r={4.6} fill="#16a34a" />
              <circle cx={126} cy={116.6} r={4.4} fill="#22c55e" />
            </g>
            <g className="food">
              <circle cx={110} cy={120} r={6} fill="#ef4444" />
              <circle cx={110} cy={120} r={4} fill="#fca5a5" />
              <circle cx={138} cy={135} r={5.4} fill="#dc2626" />
              <circle cx={138} cy={135} r={3.6} fill="#fca5a5" />
            </g>
            <g className="food">
              {BEANS.map(([cx, cy, degrees], index) => (
                <ellipse
                  key={`${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  rx={3.1}
                  ry={2.1}
                  fill={index % 3 === 0 ? "#9a3412" : "#7c2d12"}
                  transform={`rotate(${degrees} ${cx} ${cy})`}
                />
              ))}
            </g>
            <g className="food">
              <ellipse cx={171} cy={133} rx={17} ry={7.4} fill="#f59e0b" />
              <ellipse cx={171} cy={131} rx={17} ry={7.4} fill="#fbbf24" />
              <ellipse cx={171} cy={129.2} rx={16} ry={6.8} fill="#fcd34d" />
              <path
                d="M161 129 q4 -2 8 0 M172 127 q4 -2 8 0"
                stroke="#d97706"
                strokeWidth={0.7}
                strokeOpacity={0.6}
                fill="none"
              />
            </g>
            <g className="food">
              <ellipse cx={150} cy={117} rx={9.6} ry={6.8} fill="#3f6212" />
              <ellipse cx={150} cy={117} rx={7.6} ry={5.2} fill="#bef264" />
              <circle cx={150} cy={117.6} r={2.8} fill="#92400e" />
            </g>
            {[136, 150, 164].map((x) => (
              <path
                key={x}
                className="steam"
                d={`M${x} 98 q-4 -6 0 -12 q4 -6 0 -12`}
                pathLength={1}
                strokeDasharray={1}
                stroke="#fff"
                strokeWidth={1.6}
                strokeLinecap="round"
                fill="none"
                opacity={0}
              />
            ))}

            {/* Quien lo cultivó, a unos metros. */}
            <path
              className="near-path"
              d="M238 134 Q216 148 200 130"
              pathLength={1}
              strokeDasharray="0.06 0.05"
              stroke="#9a3412"
              strokeWidth={1.4}
              fill="none"
            />
            <g className="farmer">
              <rect
                x={258}
                y={128}
                width={24}
                height={14}
                rx={2}
                fill="#a16207"
              />
              <circle cx={264} cy={126} r={3.4} fill="#ef4444" />
              <circle cx={270} cy={125} r={3.4} fill="#84cc16" />
              <circle cx={276} cy={126} r={3.4} fill="#f59e0b" />
              <g transform="translate(246 146)">
                <g className="farmer-wave">
                  <Person look={CAST.tono} arms="wave" />
                </g>
                <ellipse cx={0} cy={-58.8} rx={13} ry={2.8} fill="#eab308" />
                <path
                  d="M-6.4 -59.2 Q-6.4 -68 0 -68 Q6.4 -68 6.4 -59.2 Z"
                  fill="#facc15"
                />
                <path d="M-6.3 -61 H6.3" stroke="#a16207" strokeWidth={1.6} />
              </g>
            </g>
            <g transform="translate(246 70)">
              <g className="pin">
                <path
                  d="M0 12 C-6 4 -8 0 -8 -4 A8 8 0 0 1 8 -4 C8 0 6 4 0 12 Z"
                  fill="#ea580c"
                />
                <circle cx={0} cy={-4} r={3.2} fill="#fff" />
              </g>
            </g>
            {[
              [112, 92],
              [188, 96],
              [206, 118],
              [96, 128],
            ].map(([x, y]) => (
              <path
                key={`${x}-${y}`}
                className="sparkle"
                d={`M${x} ${y - 4} L${x + 1} ${y - 1} L${x + 4} ${y} L${x + 1} ${y + 1} L${x} ${y + 4} L${x - 1} ${y + 1} L${x - 4} ${y} L${x - 1} ${y - 1} Z`}
                fill="#fbbf24"
              />
            ))}
          </g>
        </g>
      </g>
    </SceneSvg>
  );
}
