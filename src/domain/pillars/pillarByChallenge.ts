/**
 * La equivalencia entre un reto de hábitos y su pilar, en los dos sentidos.
 *
 * Vivía en `src/app/[locale]/pilares/components/pilaresData.ts`, junto a la URL y el número de cada
 * pilar, pero no es presentación: relaciona dos claves del dominio y la necesita también el
 * repositorio de adopción de prácticas, que por eso importaba de una página. Se mudó aquí por la
 * misma razón que `PillarKey`, y `pilaresData.ts` la reexporta para no tocar las páginas.
 */
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import type { PillarKey } from "./pillarKey";

/**
 * El mismo pilar visto desde el reto (`mind`) y desde la presentación (`mindSpirit`).
 *
 * Son dos vocabularios de verdad —el dominio de hábitos nombra el reto, esta lista nombra el
 * artículo— y solo difieren en el cuarto. Hasta ahora cada página resolvía la equivalencia a mano
 * pasando las dos claves como literales (`challenge="mind"` junto a `pillar="mindSpirit"`), que
 * funciona mientras nadie se equivoque de fila. Escrita una vez, un componente que reciba el reto
 * puede sacar el color sin que quien lo monte tenga que acordarse.
 */
export const PILLAR_KEY_BY_CHALLENGE: Record<
  HabitChallengeExperienceKey,
  PillarKey
> = {
  sleep: "sleep",
  nutrition: "nutrition",
  movement: "movement",
  mind: "mindSpirit",
};

/**
 * El camino de vuelta: de un pilar a su reto.
 *
 * **Se deriva, no se escribe.** `PILLAR_KEY_BY_CHALLENGE` ya es la única fuente de la equivalencia
 * —y existe justamente para que nadie vuelva a emparejarlas a mano—; una segunda tabla escrita en
 * el otro sentido sería la copia que aquella vino a evitar, y se desincronizaría el día que entre un
 * quinto pilar. Lo comprueba `pillarByChallenge.test.ts` recorriendo los cuatro de ida y vuelta.
 *
 * Lo necesita la portada de `/pilares`: el 5.10 pide que cada tarjeta enseñe **su práctica**, y el
 * nombre de la práctica vive bajo la clave del reto (`atomicChallenges.<reto>.title`).
 */
export const CHALLENGE_KEY_BY_PILLAR = Object.fromEntries(
  Object.entries(PILLAR_KEY_BY_CHALLENGE).map(([challenge, pillar]) => [
    pillar,
    challenge,
  ]),
) as Record<PillarKey, HabitChallengeExperienceKey>;
