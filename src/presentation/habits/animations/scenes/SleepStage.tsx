import { useId } from "react";
import styles from "../PillarAnimation.module.css";
import {
  Campfire,
  delay,
  on,
  Person,
  STAGE,
  StageSvg,
  Stars,
  Sun,
} from "./stagePrimitives";

const STARS: readonly [number, number][] = [
  [30, 22],
  [62, 40],
  [98, 18],
  [140, 34],
  [176, 14],
  [212, 42],
  [250, 20],
  [290, 36],
  [48, 64],
  [120, 58],
  [268, 60],
];

/**
 * Sueño: el sol como reloj, la bombilla y la pantalla, y el regreso a la luz.
 *
 * 1. Afuera: el sol se pone, se enciende la fogata, salen las estrellas.
 * 2. Adentro: se enciende la bombilla y la pantalla brilla sobre la almohada.
 * 3. La pantalla se apaga y por la ventana amanece.
 */
export default function SleepStage({ beat }: { beat: number }) {
  /* Un `id` por instancia: dos reproductores en la misma página no deben compartir el recorte. */
  const windowClip = useId();
  return (
    <StageSvg background="#fcd9a8">
      {/* Afuera, del atardecer a la noche. */}
      <g className={styles.fade} {...on(beat, -1, 0)}>
        <rect
          width={320}
          height={180}
          fill={STAGE.night}
          className={styles.fade}
          style={{ transitionDuration: "5000ms" }}
          {...on(beat, 0)}
        />
        <g className={styles.fade} style={delay(2500)} {...on(beat, 0)}>
          <Stars points={STARS} />
        </g>
        <g className={styles.sink} {...on(beat, 0)}>
          <Sun cx={228} cy={104} r={18} />
        </g>
        <path d="M0 132 Q80 104 160 126 T320 118 V180 H0 Z" fill="#312e81" />
        <Campfire x={96} y={150} />
        <Person x={60} y={156} color="#1e1b4b" />
        <Person x={132} y={156} color="#1e1b4b" />
      </g>

      {/* Adentro: la noche que dejó de ser oscura, y luego la mañana. */}
      <g className={styles.fade} {...on(beat, 1)}>
        <rect width={320} height={180} fill="#27235e" />
        <rect
          width={320}
          height={180}
          fill="#fef3c7"
          className={styles.fade}
          style={{ transitionDuration: "3500ms" }}
          {...on(beat, 2)}
        />

        {/* La ventana: luna primero, amanecer después. */}
        <rect x={214} y={22} width={78} height={62} rx={4} fill={STAGE.night} />
        <rect
          x={214}
          y={22}
          width={78}
          height={62}
          rx={4}
          fill="#fde68a"
          className={styles.fade}
          style={{ transitionDuration: "3000ms" }}
          {...on(beat, 2)}
        />
        <circle
          cx={272}
          cy={40}
          r={8}
          fill="#e0e7ff"
          className={styles.fade}
          {...on(beat, 1, 1)}
        />
        <clipPath id={windowClip}>
          <rect x={214} y={22} width={78} height={62} rx={4} />
        </clipPath>
        <g clipPath={`url(#${windowClip})`}>
          <g transform="translate(214 22)">
            <g className={styles.dawn} {...on(beat, 2)}>
              <Sun cx={39} cy={44} r={12} />
            </g>
            <path d="M0 52 Q39 40 78 50 V62 H0 Z" fill="#65a30d" />
          </g>
        </g>
        <path d="M253 22 V84 M214 53 H292" stroke="#94a3b8" strokeWidth={3} />
        <rect
          x={214}
          y={22}
          width={78}
          height={62}
          rx={4}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={4}
        />

        {/* La bombilla de 1879. */}
        <line x1={70} y1={0} x2={70} y2={30} stroke="#94a3b8" strokeWidth={2} />
        <g className={styles.fade} {...on(beat, 1, 1)}>
          <circle
            cx={70}
            cy={40}
            r={24}
            fill="#fde047"
            opacity={0.35}
            className={styles.glow}
          />
        </g>
        <circle cx={70} cy={40} r={9} fill="#fde047" />
        <rect x={65} y={28} width={10} height={5} fill="#94a3b8" />

        {/* La cama, la almohada y la pantalla. */}
        <rect x={60} y={128} width={160} height={30} rx={8} fill="#6d28d9" />
        <rect x={60} y={120} width={30} height={40} rx={6} fill="#4c1d95" />
        <rect x={94} y={116} width={50} height={16} rx={8} fill="#ede9fe" />
        <g className={styles.fade} {...on(beat, 1, 1)}>
          <circle
            cx={170}
            cy={112}
            r={26}
            fill="#93c5fd"
            opacity={0.5}
            className={styles.glow}
          />
        </g>
        <rect
          x={162}
          y={100}
          width={16}
          height={26}
          rx={3}
          fill="#0f172a"
          transform="rotate(-12 170 113)"
        />
        <rect
          x={164}
          y={103}
          width={12}
          height={19}
          rx={2}
          fill="#bfdbfe"
          transform="rotate(-12 170 113)"
          className={styles.fade}
          {...on(beat, 1, 1)}
        />
      </g>
    </StageSvg>
  );
}
