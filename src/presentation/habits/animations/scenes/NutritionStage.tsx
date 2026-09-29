import type { CSSProperties } from "react";
import styles from "../PillarAnimation.module.css";
import { delay, on, Person, STAGE, StageSvg, Sun } from "./stagePrimitives";

const STALKS = [34, 58, 82, 106, 130] as const;
const BOXES = [
  { x: 250, y: 118 },
  { x: 274, y: 118 },
  { x: 262, y: 96 },
] as const;

/**
 * Alimentación: la milpa y el mercado, la comida que viaja, y el plato que vuelve a ser cercano.
 *
 * 1. Crece la milpa y en el puesto alguien entrega lo que sembró.
 * 2. Un camión y un barco cruzan el mapa; se apilan paquetes envueltos en plástico.
 * 3. Brota una planta y aparece un plato: medio de verduras, un cuarto de proteína, un cuarto de
 *    carbohidratos del territorio (la triada del pilar).
 */
export default function NutritionStage({ beat }: { beat: number }) {
  return (
    <StageSvg background="#fef6ee">
      <g className={styles.fade} {...on(beat, -1, 0)}>
        <Sun cx={282} cy={34} />
        <rect x={0} y={148} width={320} height={32} fill="#d9b98c" />
        {STALKS.map((x, index) => (
          <g
            key={x}
            className={styles.grow}
            style={delay(index * 200)}
            {...on(beat, 0)}
          >
            <line
              x1={x}
              y1={148}
              x2={x}
              y2={74}
              stroke={STAGE.leaf}
              strokeWidth={3}
            />
            <path
              d={`M${x} 118 q14 -8 20 -22 q-16 4 -20 14`}
              fill={STAGE.sprout}
            />
            <path
              d={`M${x} 100 q-14 -8 -20 -22 q16 4 20 14`}
              fill={STAGE.sprout}
            />
            <ellipse cx={x + 5} cy={92} rx={4} ry={10} fill="#facc15" />
          </g>
        ))}

        {/* El puesto del mercado. */}
        <g className={styles.rise} style={delay(900)} {...on(beat, 0)}>
          <rect x={186} y={112} width={100} height={36} fill="#b45309" />
          <path d="M180 88 h112 l-8 18 h-96 z" fill={STAGE.brandOrange} />
          <path
            d="M200 88 l-4 18 M222 88 l-3 18 M246 88 v18 M270 88 l3 18"
            stroke="#fff"
            strokeWidth={6}
          />
          <line
            x1={190}
            y1={106}
            x2={190}
            y2={148}
            stroke="#78350f"
            strokeWidth={3}
          />
          <line
            x1={282}
            y1={106}
            x2={282}
            y2={148}
            stroke="#78350f"
            strokeWidth={3}
          />
          <circle cx={206} cy={108} r={6} fill={STAGE.nutrition} />
          <circle cx={220} cy={108} r={6} fill="#f59e0b" />
          <circle cx={234} cy={108} r={6} fill={STAGE.sprout} />
          <Person x={260} y={112} scale={0.8} />
          <Person x={166} y={160} carrying />
        </g>
      </g>

      {/* La cadena global. */}
      <g className={styles.fade} {...on(beat, 1, 1)}>
        <rect width={320} height={180} fill="#bfdbfe" />
        <path d="M0 40 Q40 30 70 60 T120 150 L0 180 Z" fill="#a3b18a" />
        <path d="M320 30 Q270 40 240 80 T220 180 L320 180 Z" fill="#a3b18a" />
        <path
          d="M40 120 C100 40 200 40 260 110"
          pathLength={1}
          stroke="#475569"
          strokeWidth={2}
          strokeDasharray="0.02 0.015"
          fill="none"
          className={styles.fade}
          {...on(beat, 1)}
        />
        <g
          className={styles.travel}
          style={{ "--distance": "34px" } as CSSProperties}
        >
          <g transform="translate(14 104)">
            <rect x={0} y={0} width={22} height={12} rx={2} fill="#e2e8f0" />
            <rect
              x={22}
              y={4}
              width={8}
              height={8}
              rx={1}
              fill={STAGE.nutrition}
            />
            <circle cx={6} cy={13} r={3} fill={STAGE.ink} />
            <circle cx={24} cy={13} r={3} fill={STAGE.ink} />
          </g>
        </g>
        <g transform="translate(130 104)">
          <g className={styles.bob}>
            <path d="M0 0 h48 l-8 12 h-32 z" fill={STAGE.ink} />
            <rect
              x={10}
              y={-10}
              width={10}
              height={10}
              fill={STAGE.brandOrange}
            />
            <rect x={22} y={-10} width={10} height={10} fill="#e2e8f0" />
          </g>
        </g>
        {BOXES.map((box, index) => (
          <g
            key={`${box.x}-${box.y}`}
            className={styles.pop}
            style={delay(1500 + index * 500)}
            {...on(beat, 1)}
          >
            <rect
              x={box.x}
              y={box.y}
              width={22}
              height={22}
              rx={2}
              fill="#e2e8f0"
              stroke="#94a3b8"
            />
            <path
              d={`M${box.x + 3} ${box.y + 4} l6 -2`}
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        ))}
      </g>

      {/* El plato cercano. */}
      <g className={styles.fade} {...on(beat, 2)}>
        <g className={styles.pop} {...on(beat, 2)}>
          <circle
            cx={150}
            cy={110}
            r={50}
            fill="#fff"
            stroke="#e2e8f0"
            strokeWidth={4}
          />
          <path
            d="M150 110 L150 66 A44 44 0 0 0 150 154 Z"
            fill={STAGE.sprout}
          />
          <path d="M150 110 L150 66 A44 44 0 0 1 194 110 Z" fill="#f59e0b" />
          <path
            d="M150 110 L194 110 A44 44 0 0 1 150 154 Z"
            fill={STAGE.nutrition}
            opacity={0.85}
          />
        </g>
        <g className={styles.grow} style={delay(700)} {...on(beat, 2)}>
          <path
            d="M238 152 C236 130 242 112 240 92"
            stroke={STAGE.leaf}
            strokeWidth={4}
            fill="none"
          />
          <path
            d="M240 112 c16 -6 26 -2 30 -14 c-14 -2 -26 2 -30 14 z"
            fill={STAGE.sprout}
          />
          <path
            d="M240 100 c-16 -6 -26 -2 -30 -14 c14 -2 26 2 30 14 z"
            fill={STAGE.sprout}
          />
        </g>
        <rect x={214} y={150} width={52} height={10} rx={5} fill="#b45309" />
      </g>
    </StageSvg>
  );
}
