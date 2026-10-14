import {
  type OutreachRhythm,
  resolveOutreachRhythm,
} from "~/domain/outreach/rhythmConfig";

let warned = false;

/** Un entorno cualquiera: `process.env` en la app, un objeto con lo justo en una prueba. */
type RhythmEnv = Record<string, string | undefined>;

/**
 * El ritmo de la difusión según el entorno: `OUTREACH_DAILY_LIMIT` (por omisión 10, de 1 a 200) y
 * `OUTREACH_PAUSE_MINUTES` (por omisión 10, de 0 a 240; 0 apaga la pausa).
 *
 * Sin prefijo `NEXT_PUBLIC_`: solo los lee el servidor, al armar la página, así que se cambian en el
 * panel del despliegue y no exigen recompilar. Un valor que no sirve no tumba la página —se usa el
 * de omisión—, pero se avisa en el registro **una vez**: una errata como «10m» no puede pasar en
 * silencio, ni llenar el registro en cada visita.
 */
export function readOutreachRhythm(
  env: RhythmEnv = process.env,
): OutreachRhythm {
  const { rhythm, rejected } = resolveOutreachRhythm({
    dailyLimit: env.OUTREACH_DAILY_LIMIT,
    pauseMinutes: env.OUTREACH_PAUSE_MINUTES,
  });

  if (rejected.length > 0 && !warned) {
    warned = true;
    console.warn(
      `[difusión] se ignoró ${rejected.join(" y ")} del entorno por no ser válido; se usa el valor por omisión.`,
      {
        OUTREACH_DAILY_LIMIT: env.OUTREACH_DAILY_LIMIT,
        OUTREACH_PAUSE_MINUTES: env.OUTREACH_PAUSE_MINUTES,
      },
    );
  }

  return rhythm;
}
