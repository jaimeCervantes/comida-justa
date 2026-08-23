import { cache } from "react";
import { currentCommunityWeek } from "~/domain/habits/habitChallenge";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import { createHabitCommunityRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";

/**
 * El jardín no tiene caso de uso propio: es una lectura sin reglas, así que la semana se resuelve
 * aquí, en el borde, y entra al repositorio como dato. El reloj se queda fuera del adaptador, que es
 * lo que permite probar la consulta con una semana fija.
 */
export const readCommunityGarden = cache(
  async (): Promise<CommunityGarden> =>
    createHabitCommunityRepository().readCommunityGarden(
      currentCommunityWeek(new Date()),
    ),
);
