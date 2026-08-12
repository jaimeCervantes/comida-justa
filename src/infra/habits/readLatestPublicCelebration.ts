import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import { readRecentPublicCelebrations } from "./readRecentPublicCelebrations";

/**
 * La última celebración compartida, para el mensaje del sitio.
 *
 * Es la lista pidiendo una sola: repetir aquí la consulta era arriesgar que un día ordenaran
 * distinto y el mensaje del encabezado anunciara una celebración que no es la primera de la lista.
 * `cache` ya lo pone `readRecentPublicCelebrations`, y con el mismo argumento devuelve lo mismo.
 */
export async function readLatestPublicCelebration(
  viewerId?: string | null,
): Promise<PublicHabitCelebration | null> {
  const [latest] = await readRecentPublicCelebrations(viewerId, 1);
  return latest ?? null;
}
