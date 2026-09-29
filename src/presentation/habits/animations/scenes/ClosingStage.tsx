import styles from "../PillarAnimation.module.css";
import { delay, on, STAGE, StageSvg, Sun } from "./stagePrimitives";

const COLUMNS = [
  { x: 88, color: STAGE.sleep },
  { x: 128, color: STAGE.nutrition },
  { x: 168, color: STAGE.movement },
  { x: 208, color: STAGE.mindSpirit },
] as const;

/**
 * El cierre: los cuatro pilares sostienen el mismo techo. Cuando llega la invitación, el templo
 * se queda de fondo y el logo pasa al frente.
 */
export default function ClosingStage({ beat }: { beat: number }) {
  return (
    <StageSvg background={STAGE.paper}>
      <Sun cx={272} cy={36} r={14} />
      <g className={styles.dim} {...on(beat, -1, 0)}>
        <rect x={72} y={148} width={176} height={10} rx={3} fill="#cbd5e1" />
        {COLUMNS.map((column, index) => (
          <rect
            key={column.x}
            x={column.x}
            y={76}
            width={24}
            height={72}
            rx={4}
            fill={column.color}
            className={styles.grow}
            style={delay(index * 200)}
            {...on(beat, 0)}
          />
        ))}
        <path
          d="M72 74 L160 30 L248 74 Z"
          pathLength={1}
          fill="none"
          stroke={STAGE.brandOrange}
          strokeWidth={5}
          strokeLinejoin="round"
          className={styles.draw}
          style={delay(1000)}
          {...on(beat, 0)}
        />
      </g>
    </StageSvg>
  );
}
