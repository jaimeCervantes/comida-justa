import styles from "../PillarAnimation.module.css";
import { delay, on, Person, STAGE, StageSvg } from "./stagePrimitives";

const TIMELINE_Y = 158;
/** Cientos de miles de años, marcas espaciadas: casi nada cambia. */
const SLOW_TICKS = Array.from({ length: 11 }, (_, index) => 24 + index * 22);
/** El último siglo, comprimido al final: todo cambia de golpe. */
const FAST_TICKS = Array.from({ length: 9 }, (_, index) => 272 + index * 3);

const COLUMNS = [
  { x: 64, color: STAGE.sleep },
  { x: 124, color: STAGE.nutrition },
  { x: 184, color: STAGE.movement },
  { x: 244, color: STAGE.mindSpirit },
] as const;

/**
 * El gancho: un cuerpo antiguo en un mundo nuevo.
 *
 * 1. Una línea de tiempo larguísima y tranquila que se aprieta de golpe en su último tramo.
 * 2. Una persona que se encoge bajo ese peso… y se relaja: «no es un fallo tuyo».
 * 3. Se levantan cuatro columnas, una por pilar.
 */
export default function IntroStage({ beat }: { beat: number }) {
  return (
    <StageSvg background={STAGE.paper}>
      <g className={styles.fade} {...on(beat, 0, 0)}>
        <path
          d={`M24 ${TIMELINE_Y} H296`}
          pathLength={1}
          stroke="#cbd5e1"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          className={styles.draw}
          {...on(beat, 0)}
        />
        {SLOW_TICKS.map((x, index) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={TIMELINE_Y - 4}
            y2={TIMELINE_Y + 4}
            stroke="#94a3b8"
            strokeWidth={1.5}
            className={styles.fade}
            style={delay(index * 120)}
            {...on(beat, 0)}
          />
        ))}
        {FAST_TICKS.map((x, index) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1={TIMELINE_Y - 7}
            y2={TIMELINE_Y + 7}
            stroke={STAGE.brandOrange}
            strokeWidth={2}
            className={styles.pop}
            style={delay(1800 + index * 110)}
            {...on(beat, 0)}
          />
        ))}
      </g>

      <g className={styles.fade} {...on(beat, 1, 1)}>
        <circle cx={160} cy={112} r={48} fill={STAGE.sun} opacity={0.18} />
        <g transform="translate(160 150) scale(2)">
          <g className={styles.slump} {...on(beat, 1, 1)}>
            <Person x={0} y={0} />
          </g>
        </g>
      </g>

      <g>
        <rect
          x={40}
          y={150}
          width={240}
          height={6}
          rx={3}
          fill="#e2e8f0"
          className={styles.fade}
          {...on(beat, 2)}
        />
        {COLUMNS.map((column, index) => (
          <rect
            key={column.x}
            x={column.x}
            y={70}
            width={24}
            height={80}
            rx={4}
            fill={column.color}
            className={styles.grow}
            style={delay(index * 250)}
            {...on(beat, 2)}
          />
        ))}
      </g>
    </StageSvg>
  );
}
