import { countSustainedWeeks, type LocalDate } from "./habitChallenge";

export const MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS = 10;

export type LeagueEligibility = "conditioned" | "eligible";

/**
 * Lo que la base sabe de quien aceptó aparecer: su alias, sus aportes de esta semana y todas las
 * fechas en que ha practicado.
 *
 * Las fechas llegan enteras y no resumidas porque quien decide qué es una semana es
 * `communityWeekStart`, anclado en `America/Mexico_City`. Calcularlo en SQL con `date_trunc` sería
 * una segunda definición de «semana» en el producto, y ya hubo que arreglar exactamente eso una vez:
 * la liga anclaba su lunes en UTC y cerraba seis horas antes que la práctica.
 */
export type LeagueParticipantActivity = {
  alias: string;
  /** Repeticiones de la semana en curso. La base ya limita a una por pilar y por día. */
  weeklyRepetitions: number;
  /** Todas las fechas locales en que esta persona ha practicado, alguna vez. */
  practiceDates: LocalDate[];
};

/**
 * Una fila de la tabla del jardín: quién aportó, cuánto y desde hace cuánto.
 *
 * **No lleva posición.** La tabla se ordena, y el orden se ve; lo que no existe es un puesto
 * proclamado, una corona ni un premio. Un ganador semanal fabrica nueve perdedores por cada
 * ganador —en salud, y casi siempre gana quien tiene la vida menos caótica—, y contradice lo que
 * este producto ya afirma de sí mismo: los niveles representan práctica acumulada, no superioridad
 * personal.
 */
export type GardenContributor = {
  alias: string;
  /** Cuánto hizo crecer el jardín esta semana. */
  contributions: number;
  /** En cuántas semanas distintas ha practicado. No baja nunca: un hueco no borra nada. */
  sustainedWeeks: number;
};

export function evaluateLeagueEligibility(
  activeOptIns: number,
): LeagueEligibility {
  return activeOptIns >= MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS
    ? "eligible"
    : "conditioned";
}

/*
 * La semana **no se calcula aquí**. Vivía en `createUtcLeagueWeek`, que anclaba el lunes en UTC:
 * para alguien en México esa semana cerraba a las 18:00 del domingo, seis horas antes que la de la
 * práctica. Dos semanas distintas en el mismo producto significan que el jardín y la tabla pueden
 * contar días distintos como «esta semana». Ahora la define `currentCommunityWeek` en
 * `habitChallenge.ts` y las dos la usan igual.
 */

/**
 * La tabla del jardín, ordenada por aporte.
 *
 * **Se cuentan aportes y no días distintos.** Con días el techo era 7, y sobre siete valores
 * posibles una tabla de veinte personas es un empate perpetuo que no se mueve — la peor versión de
 * las dos, porque no informa y aun así ordena. Un aporte es una repetición, y la base ya impone el
 * único tope que importa: `uq_habit_repetitions_local_cycle` es único por persona, reto y fecha, así
 * que **un pilar aporta una vez al día**. Caminar diez kilómetros sigue valiendo lo mismo que
 * caminar dos minutos; practicar sueño y movimiento el mismo día sí vale más que practicar uno,
 * porque es literalmente lo que proponen los cuatro pilares. Amplitud sí, intensidad no.
 *
 * El desempate es por semanas sostenidas y luego por alias, para que el orden sea estable entre
 * recargas. No hay `rank`: quien lo necesite lo lee del orden.
 */
export function buildGardenContributions(
  participants: LeagueParticipantActivity[],
): GardenContributor[] {
  return participants
    .map(({ alias, weeklyRepetitions, practiceDates }) => ({
      alias,
      contributions: weeklyRepetitions,
      sustainedWeeks: countSustainedWeeks(practiceDates),
    }))
    .sort(
      (left, right) =>
        right.contributions - left.contributions ||
        right.sustainedWeeks - left.sustainedWeeks ||
        left.alias.localeCompare(right.alias),
    );
}
