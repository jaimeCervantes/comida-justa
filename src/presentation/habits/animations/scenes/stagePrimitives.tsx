import type { CSSProperties, ReactNode } from "react";
import styles from "../PillarAnimation.module.css";

/**
 * Las piezas comunes de las escenas.
 *
 * Los colores del escenario son fijos, no tokens de tema: el escenario es un cuadro, como un video,
 * y tiene que verse igual en claro, en oscuro y el día que se exporte a video para redes. Los
 * cuatro sólidos de pilar coinciden con los de `colors.css`, que tampoco cambian con el tema.
 */
export const STAGE = {
  viewBox: "0 0 320 180",
  sleep: "#7c3aed",
  nutrition: "#dd340d",
  movement: "#408410",
  mindSpirit: "#0369a1",
  brandOrange: "#f0380e",
  leaf: "#3f6f2a",
  sprout: "#5dbf17",
  sun: "#fbbf24",
  night: "#1e1b4b",
  ink: "#334155",
  paper: "#fdf6ec",
} as const;

/**
 * Si una pieza está en escena durante el subtítulo `beat`: desde `from` y, si se da, hasta
 * `until` inclusive. `beat` vale -1 el primer cuadro de cada escena, para que lo que abre la
 * escena también entre con su transición en vez de aparecer de golpe.
 */
export function on(
  beat: number,
  from: number,
  until: number = Number.POSITIVE_INFINITY,
): { "data-on": "true" | "false" } {
  return { "data-on": beat >= from && beat <= until ? "true" : "false" };
}

export function delay(ms: number): CSSProperties {
  return { transitionDelay: `${ms}ms` };
}

export function StageSvg({
  background,
  children,
}: {
  background: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={STAGE.viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width={320} height={180} fill={background} />
      {children}
    </svg>
  );
}

/**
 * Una silueta de persona con los pies en `(x, y)`.
 *
 * La posición va en un `<g>` y el movimiento en otro de dentro: una transformación CSS reemplaza
 * al atributo `transform` del mismo elemento, así que mezclarlas movería la figura al origen.
 */
export function Person({
  x,
  y,
  scale = 1,
  color = STAGE.ink,
  walking = false,
  carrying = false,
  seated = false,
}: {
  x: number;
  y: number;
  scale?: number;
  color?: string;
  walking?: boolean;
  carrying?: boolean;
  /** Sentada: los pies en `(x, y)` y el asiento a media altura, detrás. */
  seated?: boolean;
}) {
  if (seated) {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <path
          d="M-4 -12 H10 V0"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect x={-11} y={-33} width={14} height={23} rx={6} fill={color} />
        <circle cx={-4} cy={-40} r={7} fill={color} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={walking ? styles.stride : undefined}>
        <line
          x1={-3}
          y1={-11}
          x2={-3}
          y2={0}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
      <g className={walking ? styles.strideBack : undefined}>
        <line
          x1={3}
          y1={-11}
          x2={3}
          y2={0}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
      <rect x={-7} y={-31} width={14} height={21} rx={6} fill={color} />
      <circle cx={0} cy={-38} r={7} fill={color} />
      {carrying && (
        <g className={styles.bob}>
          <path d="M-9 -47 h18 l-3 -8 h-12 z" fill="#b45309" />
          <circle cx={-3} cy={-57} r={3} fill={STAGE.nutrition} />
          <circle cx={3} cy={-57} r={3} fill={STAGE.sprout} />
        </g>
      )}
    </g>
  );
}

export function Sun({
  cx,
  cy,
  r = 16,
}: {
  cx: number;
  cy: number;
  r?: number;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 1.7} fill={STAGE.sun} opacity={0.25} />
      <circle cx={cx} cy={cy} r={r} fill={STAGE.sun} />
    </g>
  );
}

export function Campfire({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-10} r={26} fill="#f97316" opacity={0.18} />
      <rect
        x={-14}
        y={-4}
        width={28}
        height={5}
        rx={2}
        fill="#78350f"
        transform="rotate(12)"
      />
      <rect
        x={-14}
        y={-4}
        width={28}
        height={5}
        rx={2}
        fill="#92400e"
        transform="rotate(-12)"
      />
      <g className={styles.flicker}>
        <path
          d="M0 -30 C9 -18 10 -8 0 -2 C-10 -8 -9 -18 0 -30 z"
          fill="#f97316"
        />
        <path
          d="M0 -20 C5 -13 5 -7 0 -3 C-5 -7 -5 -13 0 -20 z"
          fill="#fde047"
        />
      </g>
    </g>
  );
}

export function Stars({ points }: { points: readonly [number, number][] }) {
  return (
    <g>
      {points.map(([cx, cy], index) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={1.3}
          fill="#fef9c3"
          className={styles.twinkle}
          style={{ animationDelay: `${(index % 5) * 400}ms` }}
        />
      ))}
    </g>
  );
}
