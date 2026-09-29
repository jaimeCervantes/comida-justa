import type { CSSProperties } from "react";
import styles from "../PillarAnimation.module.css";
import {
  Campfire,
  delay,
  on,
  Person,
  STAGE,
  StageSvg,
  Stars,
} from "./stagePrimitives";

const CENTER = { x: 160, y: 96 } as const;

/** Los que se sientan alrededor del fuego: un semicírculo. */
const TRIBE = [-70, -42, -14, 14, 42, 70].map((dx) => ({
  x: 160 + dx,
  y: 156 - Math.round(Math.abs(dx) * 0.28),
}));

/** Los vecinos parten lejos y acaban a un brazo de distancia del centro. */
const NEIGHBOURS = [0, 72, 144, 216, 288].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  const far = {
    x: CENTER.x + Math.cos(radians) * 140,
    y: CENTER.y + Math.sin(radians) * 90,
  };
  const near = {
    x: CENTER.x + Math.cos(radians) * 50,
    y: CENTER.y + Math.sin(radians) * 46,
  };
  return { far, dx: near.x - far.x, dy: near.y - far.y };
});

const STARS: readonly [number, number][] = [
  [24, 20],
  [70, 36],
  [118, 16],
  [202, 26],
  [250, 44],
  [296, 18],
  [150, 48],
];

const PHONE_DOTS = Array.from({ length: 24 }, (_, index) => ({
  x: 136 + (index % 4) * 16,
  y: 44 + Math.floor(index / 4) * 16,
}));

/**
 * Mente y espíritu: la tribu, la soledad conectada, y la presencia que vuelve.
 *
 * 1. Un círculo de personas alrededor del fuego, bajo las estrellas.
 * 2. Una pantalla llena de contactos y, al lado, puertas cerradas.
 * 3. Un círculo que respira y otros que se le acercan.
 */
export default function MindSpiritStage({ beat }: { beat: number }) {
  return (
    <StageSvg background={STAGE.night}>
      <g className={styles.fade} {...on(beat, -1, 0)}>
        <Stars points={STARS} />
        <rect x={0} y={150} width={320} height={30} fill="#1e3a5f" />
        <Campfire x={160} y={150} />
        {TRIBE.map((person, index) => (
          <g
            key={person.x}
            className={styles.rise}
            style={delay(300 + index * 180)}
            {...on(beat, 0)}
          >
            <Person x={person.x} y={person.y} color="#0c2a3b" />
          </g>
        ))}
      </g>

      {/* Miles de contactos, ningún vecino. */}
      <g className={styles.fade} {...on(beat, 1, 1)}>
        <rect width={320} height={180} fill="#e2e8f0" />
        <rect x={124} y={26} width={72} height={130} rx={10} fill={STAGE.ink} />
        <rect x={130} y={34} width={60} height={112} rx={4} fill="#f8fafc" />
        {PHONE_DOTS.map((dot, index) => (
          <circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={5}
            fill={index % 3 === 0 ? STAGE.mindSpirit : "#93c5fd"}
            className={styles.pop}
            style={delay(index * 70)}
            {...on(beat, 1)}
          />
        ))}
        {[18, 58, 238, 278].map((x) => (
          <g key={x}>
            <rect x={x} y={92} width={28} height={58} rx={2} fill="#94a3b8" />
            <circle cx={x + 22} cy={122} r={2} fill={STAGE.ink} />
          </g>
        ))}
        <rect x={0} y={150} width={320} height={30} fill="#cbd5e1" />
        <Person x={100} y={160} scale={0.9} />
      </g>

      {/* Presencia: respirar, y que los de cerca vuelvan a tener cara. */}
      <g className={styles.fade} {...on(beat, 2)}>
        <rect width={320} height={180} fill="#e0f2fe" />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={34}
          fill={STAGE.mindSpirit}
          opacity={0.15}
          className={styles.breathe}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={20}
          fill={STAGE.mindSpirit}
          className={styles.breathe}
        />
        {NEIGHBOURS.map((neighbour, index) => (
          <g
            key={`${neighbour.far.x}-${neighbour.far.y}`}
            className={styles.approach}
            style={
              {
                "--tx": `${neighbour.dx}px`,
                "--ty": `${neighbour.dy}px`,
                ...delay(index * 200),
              } as CSSProperties
            }
            {...on(beat, 2)}
          >
            <circle
              cx={neighbour.far.x}
              cy={neighbour.far.y}
              r={12}
              fill="#38bdf8"
            />
          </g>
        ))}
      </g>
    </StageSvg>
  );
}
