import type gsap from "gsap";
import { type ReactNode, type Ref, useId } from "react";
import type { PillarKey } from "~/domain/pillars/pillarKey";

/**
 * El kit de ilustración de las animaciones.
 *
 * Los colores del escenario son fijos, no tokens de tema: el escenario es un cuadro, como un video,
 * y tiene que verse igual en claro, en oscuro y el día que se exporte para redes.
 *
 * Todo se dibuja en un lienzo de 320 × 180. En un teléfono el escenario es 4:3 y se recorta por los
 * lados, así que lo importante vive entre x = 40 y x = 280.
 */
export const VIEWBOX = "0 0 320 180";

export const PILLAR_COLORS: Record<PillarKey, { base: string; light: string }> =
  {
    sleep: { base: "#7c3aed", light: "#a78bfa" },
    nutrition: { base: "#ea580c", light: "#fb923c" },
    movement: { base: "#16a34a", light: "#4ade80" },
    mindSpirit: { base: "#0284c7", light: "#38bdf8" },
  };

/** Ids únicos por escena montada: dos reproductores en la misma página no comparten degradados. */
export function useSvgIds(): (name: string) => string {
  const base = useId();
  return (name) => `${base}${name}`;
}

export function SceneSvg({
  svgRef,
  children,
}: {
  svgRef: Ref<SVGSVGElement>;
  children: ReactNode;
}) {
  return (
    <svg
      ref={svgRef}
      viewBox={VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="block h-full w-full"
    >
      {children}
    </svg>
  );
}

/** Aclara (`amount` > 0) u oscurece (< 0) un color `#rrggbb`. */
export function shade(hex: string, amount: number): string {
  const channel = (start: number) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16);
    const shifted = Math.round(
      Math.min(255, Math.max(0, value + amount * 255)),
    );
    return shifted.toString(16).padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

/* ── Luz ──────────────────────────────────────────────────────────────────────────────────── */

/** Un resplandor: un degradado radial que se desvanece, mucho más barato que un filtro de desenfoque. */
export function Glow({
  cx,
  cy,
  r,
  color,
  opacity = 0.6,
  className,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number;
  className?: string;
}) {
  const id = useSvgIds()("glow");
  return (
    <g className={className}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="0.45" stopColor={color} stopOpacity={opacity * 0.4} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </g>
  );
}

/* ── Personas ─────────────────────────────────────────────────────────────────────────────── */

export type HairStyle = "short" | "long" | "bun" | "curly";

export interface Look {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  hairStyle: HairStyle;
}

/** El reparto: diverso a propósito, y con la calidez de la gente a la que le habla el sitio. */
export const CAST = {
  ana: {
    skin: "#c68642",
    hair: "#2b1d16",
    top: "#ff6b5b",
    bottom: "#312e81",
    hairStyle: "long",
  },
  leo: {
    skin: "#8d5524",
    hair: "#1f1a17",
    top: "#14b8a6",
    bottom: "#1e293b",
    hairStyle: "short",
  },
  abuela: {
    skin: "#a0673a",
    hair: "#e7e5e4",
    top: "#c2410c",
    bottom: "#7c2d12",
    hairStyle: "bun",
  },
  nino: {
    skin: "#e0ac69",
    hair: "#3b2a20",
    top: "#f5b82e",
    bottom: "#1d4ed8",
    hairStyle: "curly",
  },
  sol: {
    skin: "#f1c27d",
    hair: "#6b4f3a",
    top: "#a78bfa",
    bottom: "#334155",
    hairStyle: "bun",
  },
  tono: {
    skin: "#7a4a2a",
    hair: "#111827",
    top: "#38bdf8",
    bottom: "#3f6212",
    hairStyle: "curly",
  },
  mar: {
    skin: "#d4a373",
    hair: "#1f1a17",
    top: "#34d399",
    bottom: "#4c1d95",
    hairStyle: "long",
  },
} as const satisfies Record<string, Look>;

type Pose = "stand" | "sit" | "chair";
type Arms = "down" | "up" | "wave" | "carry";

const ARM_PATHS: Record<Arms, { back: string; front: string }> = {
  down: { back: "M-4 -41 Q-8 -33 -6.5 -26", front: "M4 -41 Q8 -33 6.5 -26" },
  up: { back: "M-4 -41 Q-10 -49 -8.5 -57", front: "M4 -41 Q10 -49 8.5 -57" },
  wave: { back: "M-4 -41 Q-8 -33 -6.5 -26", front: "M4 -41 Q11 -47 10 -56" },
  carry: { back: "M-4 -41 Q1 -34 8 -32", front: "M4 -41 Q10 -36 11.5 -32" },
};

function armEnd(path: string): [number, number] {
  const numbers = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [0, 0];
  return [numbers[numbers.length - 2], numbers[numbers.length - 1]];
}

function Hair({ look }: { look: Look }) {
  const top =
    "M-7.4 -54 Q-7.8 -62.5 0.5 -61.8 Q7.6 -61.3 7.3 -55 Q3 -58.6 -2 -56.6 Q-4.2 -54.2 -7.4 -54 Z";
  switch (look.hairStyle) {
    case "long":
      return (
        <g fill={look.hair}>
          <path d="M-7.4 -56 Q-9.6 -45 -5.2 -41.5 L-1.6 -46.5 Q-4 -50 -3.4 -55.5 Z" />
          <path d={top} />
        </g>
      );
    case "bun":
      return (
        <g fill={look.hair}>
          <circle cx={-5.4} cy={-61} r={3.4} />
          <path d={top} />
        </g>
      );
    case "curly":
      return (
        <g fill={look.hair}>
          {[
            [-6.2, -55.5],
            [-5.4, -59.4],
            [-2, -61.6],
            [2, -61.6],
            [5.4, -59.2],
          ].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={3.2} />
          ))}
        </g>
      );
    default:
      return <path d={top} fill={look.hair} />;
  }
}

function HairSheen({ look }: { look: Look }) {
  if (look.hairStyle === "curly") return null;
  return (
    <path
      d="M-3.6 -60 Q0.8 -61.8 4.6 -59.6"
      stroke="#fff"
      strokeOpacity={0.2}
      strokeWidth={1}
      strokeLinecap="round"
      fill="none"
    />
  );
}

/**
 * Un brazo: piel entera y, encima, la manga hasta poco más de la mitad. La manga es el mismo trazo
 * recortado con `strokeDasharray`, así que acompaña cualquier pose sin dibujarla dos veces.
 */
function Arm({
  path,
  look,
  className,
}: {
  path: string;
  look: Look;
  className: string;
}) {
  const [handX, handY] = armEnd(path);
  return (
    <g className={className}>
      <path
        d={path}
        stroke={look.skin}
        strokeWidth={4.2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={path}
        pathLength={1}
        strokeDasharray="0.55 1"
        stroke={shade(look.top, -0.1)}
        strokeWidth={4.9}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={handX} cy={handY} r={2.5} fill={look.skin} />
    </g>
  );
}

/** Torso, brazos y cabeza de una persona de pie, con la cadera en y = −23. */
function UpperBody({ look, arms }: { look: Look; arms: Arms }) {
  const path = ARM_PATHS[arms];
  return (
    <>
      <Arm path={path.back} look={look} className="arm-b" />
      <g className="body">
        <path
          d="M-7.8 -26 H7.8 L8.2 -20.5 Q0 -18.8 -8.2 -20.5 Z"
          fill={look.bottom}
        />
        <path
          d="M-8 -23 L-8.5 -37 Q-8.5 -45 0 -45.5 Q8.5 -45 8.5 -37 L8 -23 Q0 -21 -8 -23 Z"
          fill={look.top}
        />
        <path
          d="M1.5 -45.4 Q8.5 -45 8.5 -37 L8 -23 Q4.5 -22 2.5 -22.2 Z"
          fill="#000"
          opacity={0.12}
        />
        <path
          d="M-6.6 -40 Q-6.9 -43.6 -3.4 -44.6"
          stroke="#fff"
          strokeOpacity={0.22}
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
        />
        <rect x={-2} y={-48.5} width={4} height={4.5} fill={look.skin} />
        <path d="M-2.6 -45.3 L0 -41.8 L2.6 -45.3 Z" fill={look.skin} />
      </g>
      <g className="head">
        <circle cx={0} cy={-53.5} r={7.2} fill={look.skin} />
        <circle cx={1.5} cy={-51.5} r={5.4} fill="#fff" opacity={0.08} />
        <circle cx={3.4} cy={-51.2} r={1.9} fill="#fb7185" opacity={0.28} />
        <circle cx={-1.4} cy={-53} r={1.3} fill={shade(look.skin, -0.12)} />
        <Hair look={look} />
        <HairSheen look={look} />
      </g>
      <Arm path={path.front} look={look} className="arm-f" />
    </>
  );
}

function Leg({
  look,
  x,
  className,
}: {
  look: Look;
  x: number;
  className: string;
}) {
  return (
    <g className={className}>
      <path
        d={`M${x} -24 L${x - 0.5} -3.4`}
        stroke={look.bottom}
        strokeWidth={6.4}
        strokeLinecap="round"
      />
      <path
        d={`M${x - 3} -4.6 h4.8 q3.8 0 4 3.2 v1.3 h-8.8 z`}
        fill="#1f2937"
      />
      <path d={`M${x - 3} -0.7 h8.8`} stroke="#e2e8f0" strokeWidth={0.9} />
    </g>
  );
}

export function Basket({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="basket">
      <circle cx={-3.5} cy={-4} r={3.4} fill="#ef4444" />
      <circle cx={2.5} cy={-4.6} r={3.2} fill="#84cc16" />
      <ellipse cx={-0.5} cy={-6.4} rx={2.2} ry={3.6} fill="#facc15" />
      <path d="M-8 -2 H8 L6 6 H-6 Z" fill="#b45309" />
      <path d="M-7 1 H7 M-6.4 3.6 H6.4" stroke="#92400e" strokeWidth={0.9} />
    </g>
  );
}

/**
 * Una persona sin rostro, con los pies (o el asiento) en `(0, 0)`.
 *
 * Las partes llevan clase (`leg-b`, `leg-f`, `arm-b`, `arm-f`, `head`, `body`) para que cada escena
 * las anime; la posición se pone en un `<g>` de fuera, nunca en este.
 */
export function Person({
  look,
  pose = "stand",
  arms = "down",
  holding,
  className,
}: {
  look: Look;
  pose?: Pose;
  arms?: Arms;
  holding?: "basket";
  className?: string;
}) {
  const basket = holding === "basket" && <Basket x={10} y={-30} />;
  if (pose === "sit") {
    return (
      <g className={className}>
        <ellipse cx={3} cy={0.6} rx={15} ry={2.6} fill="#000" opacity={0.18} />
        <path
          d="M-7 -4 Q3 1.5 11 -3"
          stroke={look.bottom}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx={12} cy={-2.2} rx={3.6} ry={2.2} fill="#1f2937" />
        <g transform="translate(0 19)">
          <UpperBody look={look} arms={arms} />
          {basket}
        </g>
      </g>
    );
  }
  if (pose === "chair") {
    return (
      <g className={className}>
        <path
          d="M-3 -13 H8 L9 -3"
          stroke={look.bottom}
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <ellipse cx={10.6} cy={-1.8} rx={4.3} ry={2.3} fill="#1f2937" />
        <g transform="translate(0 10)">
          <UpperBody look={look} arms={arms} />
        </g>
      </g>
    );
  }
  return (
    <g className={className}>
      <ellipse cx={1} cy={0.4} rx={11} ry={2.2} fill="#000" opacity={0.16} />
      <Leg look={look} x={-2} className="leg-b" />
      <Leg look={look} x={2.5} className="leg-f" />
      <UpperBody look={look} arms={arms} />
      {basket}
    </g>
  );
}

/** El paso: piernas y brazos en vaivén, entre `from` y `until` (segundos de la escena). */
export function walkCycle(
  tl: gsap.core.Timeline,
  root: Element | Element[],
  from: number,
  until: number,
  stepSec = 0.34,
  /** Quien carga algo camina con los brazos quietos. */
  swingArms = true,
): void {
  const find = (part: string) =>
    (Array.isArray(root) ? root : [root]).flatMap((node) =>
      Array.from(node.querySelectorAll(`.${part}`)),
    );
  const repeat = Math.max(0, Math.ceil((until - from) / stepSec) - 1);
  const swing = (part: string, degrees: number) =>
    tl.fromTo(
      find(part),
      { rotation: -degrees, transformOrigin: "50% 0%" },
      {
        rotation: degrees,
        duration: stepSec,
        ease: "sine.inOut",
        repeat,
        yoyo: true,
      },
      from,
    );
  swing("leg-b", 24);
  swing("leg-f", -24);
  if (swingArms) {
    swing("arm-b", -18);
    swing("arm-f", 18);
  }
  tl.fromTo(
    find("body").concat(find("head")),
    { y: 0 },
    {
      y: -1.2,
      duration: stepSec / 2,
      ease: "sine.inOut",
      repeat: repeat * 2 + 1,
      yoyo: true,
    },
    from,
  );
}

/**
 * Respirar: el torso crece un poco y la cabeza sube medio punto, en calma. Es lo que separa a una
 * persona quieta de un recorte pegado. No se combina con `walkCycle`, que ya mueve las mismas piezas.
 */
export function breathe(
  tl: gsap.core.Timeline,
  root: Element | Element[],
  from: number,
  until: number,
  periodSec = 1.8,
): void {
  const roots = Array.isArray(root) ? root : [root];
  const find = (part: string) =>
    roots.flatMap((node) => Array.from(node.querySelectorAll(`.${part}`)));
  const repeat = Math.max(0, Math.ceil((until - from) / (periodSec / 2)) - 1);
  const common = {
    duration: periodSec / 2,
    ease: "sine.inOut",
    repeat,
    yoyo: true,
  };
  tl.to(
    find("body"),
    { scaleY: 1.025, transformOrigin: "50% 100%", ...common },
    from,
  );
  tl.to(find("head"), { y: -0.6, ...common }, from);
}

/**
 * La deriva de una capa: cuanto más cerca está, más se desplaza. Tres capas que derivan a ritmos
 * distintos es lo que da profundidad a un plano fijo (paralaje).
 */
export function drift(
  tl: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  distance: number,
  from: number,
  until: number,
): void {
  tl.fromTo(
    targets,
    { x: 0 },
    { x: distance, duration: until - from, ease: "none" },
    from,
  );
}

/**
 * Follaje en primer plano: hojas largas que enmarcan una esquina del cuadro, como la vegetación
 * que un fotógrafo deja desenfocada delante del objetivo.
 */
export function Foliage({
  x,
  y,
  flip = false,
  scale = 1,
  color = "#14532d",
  className,
}: {
  x: number;
  y: number;
  flip?: boolean;
  scale?: number;
  color?: string;
  className?: string;
}) {
  const leaves = [-64, -44, -24, -6, 14, 34, 54];
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
    >
      <g className={className}>
        {leaves.map((degrees, index) => (
          <path
            key={degrees}
            d="M0 0 C-6 -14 -4 -32 0 -42 C4 -32 6 -14 0 0 Z"
            fill={index % 2 === 0 ? color : shade(color, 0.07)}
            transform={`rotate(${degrees}) scale(${0.62 + (index % 3) * 0.2})`}
          />
        ))}
      </g>
    </g>
  );
}

/* ── Iconos de los pilares ────────────────────────────────────────────────────────────────── */

function PillarGlyph({ pillar }: { pillar: PillarKey }) {
  switch (pillar) {
    case "sleep":
      return (
        <path
          d="M-0.33 -6.99 A7 7 0 1 0 6.33 2.99 A6 6 0 0 1 -0.33 -6.99 Z"
          fill="#fff"
        />
      );
    case "nutrition":
      return (
        <g fill="#fff">
          <path
            d="M0 7 V-1"
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <path d="M0 1.5 C-7 1.5 -8 -4.5 -7 -6.5 C-2 -6.5 0 -3 0 1.5 Z" />
          <path d="M0 -1 C6 -1 8 -7 7 -9 C2 -9 0 -6 0 -1 Z" />
        </g>
      );
    case "movement":
      return (
        <g fill="#fff">
          <path d="M-8 3 L-8 -2.5 Q-7 -5.5 -4 -4.5 L-1 -1.5 Q3 -0.5 7 0.5 Q9.4 1.6 8.4 3.6 Z" />
          <path
            d="M-9 5.4 H9"
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </g>
      );
    default:
      return (
        <g fill="#fff">
          <path d="M0 6 C-4 1 -3 -5 0 -8 C3 -5 4 1 0 6 Z" />
          <path d="M0 6 C-6 5 -9 0 -8 -4 C-4 -3 -1 1 0 6 Z" opacity={0.85} />
          <path d="M0 6 C6 5 9 0 8 -4 C4 -3 1 1 0 6 Z" opacity={0.85} />
        </g>
      );
  }
}

/** El distintivo de un pilar: su color, su número implícito en el orden y un icono claro. */
export function PillarBadge({
  pillar,
  r = 11,
  className,
}: {
  pillar: PillarKey;
  r?: number;
  className?: string;
}) {
  const id = useSvgIds()("badge");
  const color = PILLAR_COLORS[pillar];
  return (
    <g className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color.light} />
          <stop offset="1" stopColor={color.base} />
        </linearGradient>
      </defs>
      <circle r={r * 1.55} fill={color.light} opacity={0.22} />
      <circle r={r} fill={`url(#${id})`} />
      <circle r={r} fill="none" stroke="#fff" strokeOpacity={0.45} />
      <g transform={`scale(${r / 11})`}>
        <PillarGlyph pillar={pillar} />
      </g>
    </g>
  );
}

/* ── Naturaleza ───────────────────────────────────────────────────────────────────────────── */

export function Tree({
  x,
  y,
  size = 1,
  color = "#16a34a",
  className,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <g className={className}>
        <path d="M-1.6 0 L-1 -14 H1 L1.6 0 Z" fill="#7c4a24" />
        <circle cx={0} cy={-20} r={10} fill={color} />
        <circle cx={-4} cy={-16} r={7} fill={shade(color, -0.08)} />
        <circle cx={3.5} cy={-23.5} r={5} fill={shade(color, 0.12)} />
      </g>
    </g>
  );
}

export function Cloud({
  x,
  y,
  scale = 1,
  opacity = 0.9,
  className,
}: {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        className={className}
        d="M-18 4 Q-20 -4 -11 -5 Q-8 -13 1 -11 Q8 -16 13 -8 Q21 -8 20 0 Q20 4 15 4 Z"
        fill="#fff"
        opacity={opacity}
      />
    </g>
  );
}

/** Puntos de estrella repartidos de forma fija (no aleatoria: el mismo cielo en cada reproducción). */
export const STAR_POINTS: readonly [number, number, number][] = [
  [22, 18, 1.1],
  [48, 34, 0.8],
  [70, 12, 1.3],
  [96, 40, 0.9],
  [118, 22, 1.1],
  [142, 10, 0.8],
  [166, 30, 1.2],
  [190, 16, 0.9],
  [214, 38, 1.1],
  [236, 14, 0.8],
  [258, 30, 1.3],
  [282, 12, 0.9],
  [300, 42, 1.1],
  [34, 58, 0.7],
  [84, 62, 0.8],
  [150, 52, 0.7],
  [202, 60, 0.8],
  [272, 56, 0.7],
];

export function Stars({
  className,
  hidden = false,
}: {
  className?: string;
  /** Nacen apagadas: la escena las enciende al caer la noche. */
  hidden?: boolean;
}) {
  return (
    <g className={className}>
      {STAR_POINTS.map(([cx, cy, r]) => (
        <circle
          key={`${cx}-${cy}`}
          className="star"
          cx={cx}
          cy={cy}
          r={r}
          fill="#fef9c3"
          opacity={hidden ? 0 : 1}
        />
      ))}
    </g>
  );
}

/**
 * Números pseudoaleatorios con semilla (mulberry32): el mismo «azar» en cada reproducción, para
 * que una exportación a video salga idéntica a lo que se ve en la web.
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) % 4294967296;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
