"use client";
import { useRef } from "react";
import {
  breathe,
  CAST,
  drift,
  Foliage,
  Glow,
  Person,
  SceneSvg,
  Stars,
  seededRandom,
  shade,
  useSvgIds,
} from "./kit";
import { type SceneProps, useSceneTimeline } from "./useSceneTimeline";

/** El recorrido del sol: un arco con marcas de hora, la esfera del único reloj que había. */
const SUN_ARC = "M40 128 A120 110 0 0 1 280 128";
const DIAL_TICKS = [150, 120, 90, 60, 30].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  const at = (grow: number) => ({
    x: 160 + (120 + grow) * Math.cos(radians),
    y: 128 - (110 + grow) * Math.sin(radians),
  });
  return { from: at(3), to: at(9) };
});

/** La ciudad: edificios fijos y ventanas que se encienden en un orden «al azar», pero siempre igual. */
const BUILDINGS = [
  { x: 14, w: 26, h: 58 },
  { x: 42, w: 20, h: 82 },
  { x: 64, w: 30, h: 46 },
  { x: 96, w: 22, h: 70 },
  { x: 120, w: 28, h: 96 },
  { x: 150, w: 20, h: 62 },
  { x: 172, w: 32, h: 88 },
  { x: 206, w: 22, h: 54 },
  { x: 230, w: 26, h: 76 },
  { x: 258, w: 20, h: 60 },
  { x: 280, w: 28, h: 84 },
] as const;
const CITY_BASE = 162;
const WINDOWS = BUILDINGS.flatMap(({ x, w, h }) => {
  const columns = Math.floor((w - 6) / 6);
  const rows = Math.floor((h - 10) / 8);
  return Array.from({ length: columns * rows }, (_, index) => ({
    x: x + 4 + (index % columns) * 6,
    y: CITY_BASE - h + 6 + Math.floor(index / columns) * 8,
  }));
});
const random = seededRandom(1879);
const WINDOW_DELAYS = WINDOWS.map(() => random() * 1.6);

const NOTIFICATIONS = [
  { x: 110, y: 72, color: "#f43f5e" },
  { x: 126, y: 60, color: "#22c55e" },
  { x: 106, y: 48, color: "#3b82f6" },
  { x: 124, y: 36, color: "#f59e0b" },
] as const;

const DUST = [
  [150, 120],
  [170, 96],
  [188, 70],
  [140, 140],
  [206, 104],
  [214, 60],
  [230, 84],
  [178, 128],
] as const;

/**
 * Sueño, en tres actos.
 *
 * 1. El sol recorre su arco —la esfera del reloj que fue— y se pone; alrededor del fuego, la gente
 *    se acuesta cuando oscurece.
 * 2. 1879: cae una bombilla y se enciende; la ciudad entera se ilumina. La cámara entra por una
 *    ventana: una cara iluminada por el teléfono, notificaciones, el reloj que avanza.
 * 3. El teléfono se apaga, una lámpara baja y cálida, y por la ventana amanece: la persona despierta
 *    estirándose bajo los rayos del sol.
 */
export default function SleepScene(props: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgIds();
  const sleeper = CAST.sol;

  useSceneTimeline(svgRef, props, ({ tl, q, beat, duration, loop }) => {
    tl.from(q(".scene"), { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
    tl.fromTo(
      q(".camera"),
      { scale: 1.08, svgOrigin: "160 90" },
      { scale: 1, svgOrigin: "160 90", duration: 2.6, ease: "power3.out" },
      0,
    );

    // 1 · El sol como reloj.
    const arc = q(".sun-arc")[0] as SVGPathElement;
    tl.to(
      q(".sun"),
      {
        motionPath: {
          path: arc,
          align: arc,
          alignOrigin: [0.5, 0.5],
          start: 0.3,
          end: 1,
        },
        duration: 5.4,
        ease: "sine.inOut",
      },
      0,
    );
    tl.to(
      q(".sky-top"),
      { stopColor: "#6d28d9", duration: 2.2, ease: "sine.inOut" },
      1.6,
    );
    tl.to(
      q(".sky-bottom"),
      { stopColor: "#f472b6", duration: 2.2, ease: "sine.inOut" },
      1.6,
    );
    tl.to(
      q(".sky-top"),
      { stopColor: "#0b1026", duration: 2.2, ease: "sine.inOut" },
      3.8,
    );
    tl.to(
      q(".sky-bottom"),
      { stopColor: "#312e81", duration: 2.2, ease: "sine.inOut" },
      3.8,
    );
    tl.to(q(".hill-far"), { fill: "#312e81", duration: 3.6 }, 2.2);
    tl.to(q(".hill-mid"), { fill: "#1e1b4b", duration: 3.6 }, 2.2);
    tl.to(q(".hill-near"), { fill: "#120d2b", duration: 3.6 }, 2.2);
    tl.to(q(".dial"), { opacity: 0.12, duration: 2 }, 4);
    tl.to(q(".star"), { opacity: 1, stagger: 0.06, duration: 0.5 }, 3.8);
    loop(q(".star"), { opacity: 0.35 }, 1.4, 5.6, beat(1));
    tl.fromTo(
      q(".moon"),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 1.4 },
      4.4,
    );
    loop(
      q(".flame"),
      { scaleY: 1.16, scaleX: 0.92, transformOrigin: "50% 100%" },
      0.42,
      0,
      beat(1),
    );
    loop(
      q(".fire-glow"),
      { scale: 1.08, opacity: 0.85, transformOrigin: "50% 50%" },
      0.9,
      0,
      beat(1),
    );
    tl.to(q(".sitters"), { opacity: 0, duration: 0.6 }, 4.6);
    tl.to(q(".sleepers"), { opacity: 1, duration: 0.8 }, 4.8);
    tl.to(
      q(".fire"),
      { scale: 0.55, transformOrigin: "50% 100%", duration: 1.2 },
      5,
    );

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
    breathe(tl, q(".sitters"), 0.2, 4.6);

    // 2 · 1879, y las pantallas.
    tl.to(
      q(".act-dusk"),
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
      q(".act-bulb"),
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
    tl.fromTo(
      q(".bulb"),
      { y: -64 },
      { y: 0, duration: 1, ease: "bounce.out" },
      beat(1, 0.2),
    );
    tl.to(q(".bulb-glass"), { fill: "#fef08a", duration: 0.15 }, beat(1, 1.2));
    tl.to(q(".filament"), { stroke: "#f59e0b", duration: 0.15 }, beat(1, 1.2));
    tl.fromTo(
      q(".bulb-glow"),
      { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" },
      { opacity: 1, scale: 1, duration: 0.8, ease: "expo.out" },
      beat(1, 1.2),
    );
    tl.fromTo(
      q(".flash"),
      { opacity: 0 },
      { opacity: 0.4, duration: 0.08, yoyo: true, repeat: 1 },
      beat(1, 1.2),
    );
    tl.fromTo(
      q(".city"),
      { y: 70 },
      { y: 0, duration: 1.4, ease: "power3.out" },
      beat(1, 1.5),
    );
    tl.to(
      q(".win"),
      {
        opacity: 1,
        duration: 0.12,
        stagger: (index: number) => WINDOW_DELAYS[index] ?? 0,
      },
      beat(1, 2.1),
    );
    tl.fromTo(
      q(".haze"),
      { opacity: 0 },
      { opacity: 1, duration: 1.6 },
      beat(1, 2.2),
    );
    tl.to(
      q(".act-bulb"),
      {
        scale: 3.2,
        opacity: 0,
        duration: 1.1,
        ease: "power2.in",
        svgOrigin: "188 112",
      },
      beat(1, 3.8),
    );
    tl.to(q(".act-bedroom"), { opacity: 1, duration: 0.8 }, beat(1, 4.3));
    tl.fromTo(
      q(".bedroom-camera"),
      { scale: 1.18, svgOrigin: "150 110" },
      { scale: 1, svgOrigin: "150 110", duration: 1.6, ease: "power3.out" },
      beat(1, 4.3),
    );
    loop(
      q(".phone-glow"),
      { opacity: 0.6, scale: 1.08, transformOrigin: "50% 50%" },
      0.9,
      beat(1, 4.6),
      beat(2),
    );
    tl.from(
      q(".notif"),
      {
        opacity: 0,
        scale: 0.6,
        y: 6,
        stagger: 0.8,
        duration: 0.45,
        ease: "back.out(2)",
        transformOrigin: "50% 100%",
      },
      beat(1, 5),
    );
    loop(
      q(".blanket"),
      { scaleY: 1.035, transformOrigin: "50% 100%" },
      1.2,
      beat(1, 4.6),
      beat(2, 3.8),
    );
    tl.to(q(".clock-a"), { opacity: 0, duration: 0.3 }, beat(1, 7.4));
    tl.to(q(".clock-b"), { opacity: 1, duration: 0.3 }, beat(1, 7.4));

    // 3 · Volver a la luz.
    tl.to(q(".phone-glow, .cone"), { opacity: 0, duration: 0.6 }, beat(2, 0.1));
    tl.to(q(".screen"), { fill: "#0f172a", duration: 0.3 }, beat(2, 0.1));
    tl.to(
      q(".notif"),
      { opacity: 0, y: -6, duration: 0.4, stagger: 0.08 },
      beat(2, 0.1),
    );
    tl.to(q(".phone-arm"), { opacity: 0, duration: 0.4 }, beat(2, 0.5));
    tl.to(q(".phone-rest"), { opacity: 1, duration: 0.4 }, beat(2, 0.7));
    tl.to(q(".lamp-glow"), { opacity: 1, duration: 0.8 }, beat(2, 1));
    tl.to(q(".warm"), { opacity: 0.2, duration: 1.2 }, beat(2, 1));
    tl.to(q(".clock-b"), { opacity: 0, duration: 0.3 }, beat(2, 1.8));
    tl.to(q(".clock-c"), { opacity: 1, duration: 0.3 }, beat(2, 1.8));
    tl.to(
      q(".win-sky-top"),
      { stopColor: "#fb923c", duration: 2.2 },
      beat(2, 2.2),
    );
    tl.to(
      q(".win-sky-bottom"),
      { stopColor: "#fde68a", duration: 2.2 },
      beat(2, 2.2),
    );
    tl.to(q(".city-lights"), { opacity: 0, duration: 1.4 }, beat(2, 2.2));
    tl.fromTo(
      q(".dawn-sun"),
      { y: 30 },
      { y: 0, duration: 2.6, ease: "power2.out" },
      beat(2, 2.2),
    );
    tl.to(q(".lamp-glow"), { opacity: 0, duration: 1 }, beat(2, 3.4));
    tl.to(
      q(".wall-top"),
      { stopColor: "#c4b5fd", duration: 2.4 },
      beat(2, 2.4),
    );
    tl.to(
      q(".wall-bottom"),
      { stopColor: "#fbcfe8", duration: 2.4 },
      beat(2, 2.4),
    );
    tl.to(
      q(".warm"),
      { opacity: 0.28, fill: "#fcd34d", duration: 2 },
      beat(2, 2.6),
    );
    tl.to(q(".beam"), { opacity: 1, duration: 1.6, stagger: 0.3 }, beat(2, 3));
    loop(q(".beam"), { opacity: 0.7 }, 1.6, beat(2, 4.9), duration);
    tl.to(q(".sleeper"), { opacity: 0, duration: 0.5 }, beat(2, 3.8));
    tl.fromTo(
      q(".awake"),
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.8, ease: "back.out(2)" },
      beat(2, 4),
    );
    tl.to(
      q(".dust"),
      { opacity: 0.85, duration: 0.8, stagger: 0.1 },
      beat(2, 3.6),
    );
    loop(q(".dust"), { y: -6, x: 3 }, 2.2, beat(2, 4.5), duration);
  });

  return (
    <SceneSvg svgRef={svgRef}>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop className="sky-top" offset="0" stopColor="#fb923c" />
          <stop className="sky-bottom" offset="1" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={id("wall")} x1="0" y1="0" x2="0" y2="1">
          <stop className="wall-top" offset="0" stopColor="#1e1b4b" />
          <stop className="wall-bottom" offset="1" stopColor="#3b2a7a" />
        </linearGradient>
        <linearGradient id={id("window")} x1="0" y1="0" x2="0" y2="1">
          <stop className="win-sky-top" offset="0" stopColor="#0b1026" />
          <stop className="win-sky-bottom" offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient
          id={id("beam")}
          gradientUnits="userSpaceOnUse"
          x1="232"
          y1="28"
          x2="140"
          y2="152"
        >
          <stop offset="0" stopColor="#fde68a" stopOpacity={0.75} />
          <stop offset="1" stopColor="#fde68a" stopOpacity={0} />
        </linearGradient>
        <clipPath id={id("window-clip")}>
          <rect x={196} y={24} width={76} height={66} rx={3} />
        </clipPath>
      </defs>

      <g className="scene">
        <g className="camera">
          {/* 1 · El atardecer: el sol como reloj. */}
          <g className="act-dusk">
            <rect width={320} height={180} fill={`url(#${id("sky")})`} />
            <Stars hidden />
            <g className="dial">
              <path
                className="sun-arc"
                d={SUN_ARC}
                stroke="#fff"
                strokeOpacity={0.4}
                strokeDasharray="1.5 4"
                fill="none"
              />
              {DIAL_TICKS.map(({ from, to }) => (
                <line
                  key={`${from.x}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#fff"
                  strokeOpacity={0.55}
                  strokeWidth={1.2}
                  strokeLinecap="round"
                />
              ))}
            </g>
            <g className="sun">
              <Glow cx={90} cy={40} r={34} color="#fde047" opacity={0.75} />
              <circle cx={90} cy={40} r={10} fill="#fde047" />
              <circle cx={88} cy={38} r={6} fill="#fef9c3" opacity={0.6} />
            </g>
            <g className="moon" opacity={0}>
              <Glow cx={246} cy={40} r={26} color="#e0e7ff" opacity={0.35} />
              <path
                transform="translate(246 40) scale(1.2)"
                d="M-0.33 -6.99 A7 7 0 1 0 6.33 2.99 A6 6 0 0 1 -0.33 -6.99 Z"
                fill="#e0e7ff"
              />
            </g>
            <g className="par-far">
              <path
                className="hill-far"
                d="M-30 118 Q60 96 120 112 T240 104 T360 110 V180 H-30 Z"
                fill="#f9a8d4"
              />
            </g>
            <g className="par-mid">
              <path
                className="hill-mid"
                d="M-30 132 Q80 114 150 128 T330 122 T380 124 V180 H-30 Z"
                fill="#c084fc"
              />
            </g>
            <g className="par-near">
              <path
                className="hill-near"
                d="M-30 146 Q90 136 170 146 T370 142 V180 H-30 Z"
                fill="#7e22ce"
              />
              <g className="fire-glow">
                <Glow cx={160} cy={146} r={52} color="#fb923c" opacity={0.7} />
              </g>
              <g className="sitters">
                <g transform="translate(134 154)">
                  <Person look={CAST.leo} pose="sit" />
                </g>
                <g transform="translate(188 154) scale(-1 1)">
                  <Person look={CAST.ana} pose="sit" />
                </g>
                <g transform="translate(112 156) scale(0.78)">
                  <Person look={CAST.nino} pose="sit" />
                </g>
              </g>
              <g className="sleepers" opacity={0}>
                <rect
                  x={112}
                  y={147}
                  width={34}
                  height={8}
                  rx={4}
                  fill="#4c1d95"
                />
                <circle cx={110} cy={150} r={4.4} fill={CAST.leo.skin} />
                <rect
                  x={176}
                  y={147}
                  width={34}
                  height={8}
                  rx={4}
                  fill="#6d28d9"
                />
                <circle cx={213} cy={150} r={4.4} fill={CAST.ana.skin} />
              </g>
              <g transform="translate(160 156)">
                <g className="fire">
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
                    className="flame"
                    d="M0 -24 C8 -14 9 -6 0 -1 C-9 -6 -8 -14 0 -24 Z"
                    fill="#f97316"
                  />
                  <path
                    className="flame"
                    d="M0 -15 C4.5 -9 4.5 -5 0 -2 C-4.5 -5 -4.5 -9 0 -15 Z"
                    fill="#fde047"
                  />
                </g>
              </g>
            </g>
            <g className="par-front">
              <Foliage
                x={16}
                y={188}
                color="#2e1065"
                className="foliage-sway"
              />
              <Foliage
                x={306}
                y={190}
                flip
                scale={0.9}
                color="#2e1065"
                className="foliage-sway"
              />
            </g>
          </g>

          {/* 2 · 1879: la noche deja de ser oscura. */}
          <g className="act-bulb" opacity={0}>
            <rect width={320} height={180} fill="#0b1026" />
            <Stars />
            <g className="haze">
              <Glow cx={160} cy={176} r={150} color="#f97316" opacity={0.45} />
            </g>
            <g className="city">
              {BUILDINGS.map(({ x, w, h }, index) => (
                <rect
                  key={x}
                  x={x}
                  y={CITY_BASE - h}
                  width={w}
                  height={h + 20}
                  rx={1.5}
                  fill={index % 2 === 0 ? "#1e1b4b" : "#272057"}
                />
              ))}
              {WINDOWS.map(({ x, y }) => (
                <rect
                  key={`${x}-${y}`}
                  className="win"
                  x={x}
                  y={y}
                  width={3}
                  height={4}
                  rx={0.5}
                  fill="#fde68a"
                  opacity={0}
                />
              ))}
            </g>
            <g className="bulb">
              <g className="bulb-glow">
                <Glow cx={160} cy={43} r={86} color="#fde047" opacity={0.85} />
              </g>
              <line
                x1={160}
                y1={-40}
                x2={160}
                y2={30}
                stroke="#94a3b8"
                strokeWidth={1.2}
              />
              <rect
                x={155.5}
                y={28}
                width={9}
                height={7}
                rx={1.5}
                fill="#94a3b8"
              />
              <circle
                className="bulb-glass"
                cx={160}
                cy={44}
                r={10}
                fill="#334155"
                stroke="#64748b"
              />
              <path
                className="filament"
                d="M155 45 l2.5 -4 l2.5 4 l2.5 -4 l2.5 4"
                stroke="#64748b"
                strokeWidth={1}
                fill="none"
              />
            </g>
            <rect
              className="flash"
              width={320}
              height={180}
              fill="#fff"
              opacity={0}
            />
          </g>

          {/* 2 y 3 · El cuarto: la pantalla hasta la almohada, y luego el amanecer. */}
          <g className="act-bedroom" opacity={0}>
            <g className="bedroom-camera">
              <rect width={320} height={180} fill={`url(#${id("wall")})`} />
              <rect y={150} width={320} height={30} fill="#1a1440" />
              <ellipse
                cx={130}
                cy={166}
                rx={78}
                ry={8}
                fill="#4c1d95"
                opacity={0.6}
              />

              <g clipPath={`url(#${id("window-clip")})`}>
                <rect
                  x={196}
                  y={24}
                  width={76}
                  height={66}
                  fill={`url(#${id("window")})`}
                />
                <g className="dawn-sun">
                  <Glow cx={234} cy={76} r={30} color="#fde047" opacity={0.8} />
                  <circle cx={234} cy={76} r={9} fill="#fde047" />
                </g>
                <g className="city-lights">
                  {[198, 212, 224, 240, 252, 264].map((x, index) => (
                    <g key={x}>
                      <rect
                        x={x}
                        y={70 - (index % 3) * 6}
                        width={11}
                        height={24}
                        fill="#0f0a24"
                      />
                      <rect
                        x={x + 3}
                        y={74 - (index % 3) * 6}
                        width={2}
                        height={2}
                        fill="#fde68a"
                      />
                      <rect
                        x={x + 6}
                        y={80 - (index % 3) * 6}
                        width={2}
                        height={2}
                        fill="#fde68a"
                      />
                    </g>
                  ))}
                </g>
                <path d="M196 84 Q234 74 272 82 V92 H196 Z" fill="#1e1b4b" />
              </g>
              <rect
                x={196}
                y={24}
                width={76}
                height={66}
                rx={3}
                fill="none"
                stroke="#e9d5ff"
                strokeWidth={3}
              />
              <path
                d="M234 24 V90 M196 57 H272"
                stroke="#e9d5ff"
                strokeWidth={2}
              />
              <path
                d="M186 18 Q194 58 188 100 L198 100 Q200 58 198 18 Z"
                fill="#7c3aed"
              />
              <path
                d="M270 18 Q268 58 270 100 L280 100 Q274 58 282 18 Z"
                fill="#7c3aed"
              />

              {/* La mesita: lámpara, reloj y, al final, el teléfono boca abajo. */}
              <g className="lamp-glow" opacity={0}>
                <Glow cx={218} cy={104} r={46} color="#fbbf24" opacity={0.75} />
              </g>
              <rect
                x={202}
                y={124}
                width={32}
                height={26}
                rx={3}
                fill="#4c1d95"
              />
              <path d="M205 136 H231" stroke="#6d28d9" strokeWidth={1} />
              <line
                x1={218}
                y1={108}
                x2={218}
                y2={124}
                stroke="#e9d5ff"
                strokeWidth={1.4}
              />
              <path
                d="M209 108 L227 108 L222.5 97 L213.5 97 Z"
                fill="#fde68a"
              />
              <rect
                x={205}
                y={128}
                width={22}
                height={9}
                rx={2}
                fill="#0f0a24"
              />
              <g
                fontFamily="ui-monospace, monospace"
                fontSize={6.2}
                textAnchor="middle"
                fill="#f472b6"
              >
                <text className="clock-a" x={216} y={134.8}>
                  1:47
                </text>
                <text className="clock-b" x={216} y={134.8} opacity={0}>
                  2:31
                </text>
                <text
                  className="clock-c"
                  x={216}
                  y={134.8}
                  opacity={0}
                  fill="#fbbf24"
                >
                  6:30
                </text>
              </g>
              <rect
                className="phone-rest"
                x={222}
                y={120.5}
                width={11}
                height={3.2}
                rx={1.2}
                fill="#0f172a"
                opacity={0}
              />

              {/* La cama. */}
              <rect
                x={46}
                y={94}
                width={12}
                height={56}
                rx={5}
                fill="#4c1d95"
              />
              <rect
                x={52}
                y={122}
                width={128}
                height={18}
                rx={6}
                fill="#ede9fe"
              />
              <rect
                x={50}
                y={138}
                width={132}
                height={8}
                rx={3}
                fill="#5b21b6"
              />
              <rect x={56} y={146} width={5} height={6} fill="#4c1d95" />
              <rect x={172} y={146} width={5} height={6} fill="#4c1d95" />
              <rect
                x={60}
                y={110}
                width={32}
                height={12}
                rx={6}
                fill="#faf5ff"
              />

              <g className="sleeper">
                <circle cx={80} cy={112} r={7} fill={sleeper.skin} />
                <path
                  d="M73 111 Q74 102 82 103 Q88 104 88 110 Q84 106 79 107 Q76 108 73 111 Z"
                  fill={sleeper.hair}
                />
              </g>
              <g className="awake" opacity={0}>
                <g transform="translate(84 128)">
                  <Person look={sleeper} pose="sit" arms="up" />
                </g>
              </g>
              <path
                className="blanket"
                d="M92 122 Q98 110 118 112 Q150 114 180 118 L180 140 L90 140 Z"
                fill="#8b5cf6"
              />
              <path
                d="M100 120 Q130 115 172 122"
                stroke="#a78bfa"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />

              <g className="sleeper">
                <g className="phone-glow">
                  <Glow cx={96} cy={96} r={36} color="#60a5fa" opacity={0.8} />
                </g>
                <path
                  className="cone"
                  d="M93 101 L100 101 L88 114 L76 110 Z"
                  fill="#93c5fd"
                  opacity={0.3}
                />
                <g className="phone-arm">
                  <path
                    d="M106 118 Q98 112 98 101"
                    stroke={shade(sleeper.top, -0.12)}
                    strokeWidth={4.4}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx={98} cy={100} r={2.4} fill={sleeper.skin} />
                  <rect
                    x={92}
                    y={85}
                    width={10}
                    height={16}
                    rx={2}
                    fill="#0f172a"
                  />
                  <rect
                    className="screen"
                    x={93.2}
                    y={86.6}
                    width={7.6}
                    height={12.6}
                    rx={1}
                    fill="#bfdbfe"
                  />
                </g>
                {NOTIFICATIONS.map(({ x, y, color }) => (
                  <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                    <g className="notif">
                      <rect
                        x={-13}
                        y={-5}
                        width={26}
                        height={10}
                        rx={5}
                        fill="#fff"
                        opacity={0.95}
                      />
                      <circle cx={-8} cy={0} r={3} fill={color} />
                      <rect
                        x={-3}
                        y={-2.4}
                        width={12}
                        height={1.7}
                        rx={0.8}
                        fill="#cbd5e1"
                      />
                      <rect
                        x={-3}
                        y={0.8}
                        width={8}
                        height={1.7}
                        rx={0.8}
                        fill="#e2e8f0"
                      />
                    </g>
                  </g>
                ))}
              </g>

              <rect
                className="warm"
                width={320}
                height={180}
                fill="#fb923c"
                opacity={0}
              />
              <path
                className="beam"
                d="M198 28 L236 28 L150 152 L92 152 Z"
                fill={`url(#${id("beam")})`}
                opacity={0}
              />
              <path
                className="beam"
                d="M244 28 L268 28 L198 152 L168 152 Z"
                fill={`url(#${id("beam")})`}
                opacity={0}
              />
              {DUST.map(([cx, cy]) => (
                <circle
                  key={`${cx}-${cy}`}
                  className="dust"
                  cx={cx}
                  cy={cy}
                  r={0.9}
                  fill="#fff"
                  opacity={0}
                />
              ))}
            </g>
          </g>
        </g>
      </g>
    </SceneSvg>
  );
}
