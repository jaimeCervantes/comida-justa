import styles from "../PillarAnimation.module.css";
import { delay, on, Person, STAGE, StageSvg, Sun } from "./stagePrimitives";

const TREES = [
  { x: 40, y: 120 },
  { x: 92, y: 104 },
  { x: 250, y: 100 },
] as const;

/**
 * Movimiento: moverse era vivir, el techo que baja, y el cuerpo de vuelta en el barrio.
 *
 * 1. Alguien camina al campo cargando la cosecha.
 * 2. Baja el techo sobre una silla y una pantalla; un coche recorre dos cuadras.
 * 3. Se dibuja un sendero entre árboles, alguien lo camina y rebota un balón en la cancha.
 */
export default function MovementStage({ beat }: { beat: number }) {
  return (
    <StageSvg background="#e0f2fe">
      <g className={styles.fade} {...on(beat, -1, 0)}>
        <Sun cx={54} cy={36} />
        <rect x={0} y={130} width={320} height={50} fill="#a3c77a" />
        {[140, 152, 164, 176].map((y) => (
          <line
            key={y}
            x1={0}
            y1={y}
            x2={320}
            y2={y - 6}
            stroke="#86a95f"
            strokeWidth={2}
          />
        ))}
        <g transform="translate(100 150) scale(1.4)">
          <g className={styles.walk}>
            <Person x={0} y={0} walking carrying />
          </g>
        </g>
      </g>

      {/* Adentro, sentados. */}
      <g className={styles.fade} {...on(beat, 1, 1)}>
        <rect width={320} height={180} fill="#e2e8f0" />
        <rect x={0} y={150} width={320} height={30} fill="#cbd5e1" />
        <rect
          x={0}
          y={0}
          width={320}
          height={64}
          fill="#475569"
          className={styles.ceiling}
          {...on(beat, 1)}
        />
        <rect x={120} y={112} width={90} height={6} fill="#64748b" />
        <rect x={150} y={84} width={34} height={24} rx={2} fill={STAGE.ink} />
        <rect x={153} y={87} width={28} height={18} rx={1} fill="#93c5fd" />
        <rect x={84} y={138} width={28} height={4} fill="#64748b" />
        <line
          x1={90}
          y1={142}
          x2={90}
          y2={150}
          stroke="#64748b"
          strokeWidth={3}
        />
        <rect x={82} y={112} width={4} height={28} rx={2} fill="#64748b" />
        <Person x={98} y={150} seated />
        {/* Dos cuadras, en coche. */}
        <rect x={228} y={132} width={10} height={18} fill="#94a3b8" />
        <rect x={292} y={132} width={10} height={18} fill="#94a3b8" />
        <g className={styles.shortDrive}>
          <g transform="translate(236 140)">
            <rect
              x={0}
              y={0}
              width={20}
              height={8}
              rx={3}
              fill={STAGE.brandOrange}
            />
            <rect
              x={4}
              y={-5}
              width={11}
              height={6}
              rx={2}
              fill={STAGE.brandOrange}
            />
            <circle cx={5} cy={9} r={2.5} fill={STAGE.ink} />
            <circle cx={15} cy={9} r={2.5} fill={STAGE.ink} />
          </g>
        </g>
      </g>

      {/* El barrio. */}
      <g className={styles.fade} {...on(beat, 2)}>
        <rect x={0} y={110} width={320} height={70} fill="#a3c77a" />
        <path
          d="M-10 170 C60 130 120 170 170 138 S270 120 330 128"
          pathLength={1}
          stroke="#e7d3a8"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
          className={styles.draw}
          {...on(beat, 2)}
        />
        {TREES.map((tree, index) => (
          <g
            key={tree.x}
            className={styles.pop}
            style={delay(600 + index * 250)}
            {...on(beat, 2)}
          >
            <rect
              x={tree.x - 2}
              y={tree.y}
              width={4}
              height={16}
              fill="#78350f"
            />
            <circle cx={tree.x} cy={tree.y - 6} r={13} fill={STAGE.movement} />
          </g>
        ))}
        <g transform="translate(130 150) scale(1.2)">
          <g className={styles.walk}>
            <Person x={0} y={0} walking />
          </g>
        </g>
        <path
          d="M268 120 v-22 h36 v22"
          stroke="#fff"
          strokeWidth={3}
          fill="none"
        />
        <g className={styles.bounce}>
          <circle
            cx={284}
            cy={136}
            r={6}
            fill="#fff"
            stroke={STAGE.ink}
            strokeWidth={1.5}
          />
        </g>
      </g>
    </StageSvg>
  );
}
