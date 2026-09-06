import {
  COMMUNITY_TIMEZONE,
  currentCommunityWeek,
  localDateAt,
} from "~/domain/habits/habitChallenge";
import { PILLAR_KEYS, type PillarKey } from "~/domain/pillars/pillarKey";
import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";
import { activeKeys } from "~/domain/practices/adoption";
import type { PracticeAdoptionRepository } from "./ports/PracticeAdoptionRepository";

export type WeeklyPillarPracticeProgress = {
  pillar: PillarKey;
  completedDays: number;
  countedToday: boolean;
};

export default class PracticeAdoptionUseCase {
  constructor(private readonly repository: PracticeAdoptionRepository) {}

  /**
   * Qué lleva esta persona, en la forma que la lista necesita para preguntarlo 45 veces.
   *
   * Quien no ha entrado no lleva nada, y eso no es un error: el índice de prácticas es público y se
   * lee igual sin sesión. Devolver un conjunto vacío en vez de exigir identidad es lo que permite
   * que la página no tenga dos versiones.
   */
  async activeFor(userId: string | null): Promise<ReadonlySet<string>> {
    if (!userId) return new Set();
    return activeKeys(await this.repository.listFor(userId));
  }

  async listFor(userId: string): Promise<readonly PracticeAdoption[]> {
    return this.repository.listFor(userId);
  }

  async sharedActiveFor(userId: string): Promise<readonly PracticeAdoption[]> {
    return this.repository.listSharedActiveFor(userId);
  }

  /**
   * Empezar es idempotente y **reabre** lo que se había dejado.
   *
   * Volver después de dejarlo no crea una segunda adopción ni reinicia la fecha de inicio: la
   * primera vez que alguien empezó algo es un dato que este producto no tira, porque toda su
   * gamificación está construida sobre premiar el regreso.
   */
  async start(
    userId: string,
    practiceKey: string,
    source: PracticeSource = "web",
  ): Promise<boolean> {
    return this.repository.start(userId, practiceKey, source);
  }

  async stop(userId: string, practiceKey: string): Promise<void> {
    await this.repository.stop(userId, practiceKey);
  }

  async setSharing(
    userId: string,
    practiceKey: string,
    enabled: boolean,
  ): Promise<void> {
    await this.repository.setSharing(userId, practiceKey, enabled);
  }

  /**
   * Qué pilares ya cuentan hoy para esta persona.
   *
   * «Hoy» es la fecha local de la comunidad y no la del navegador: la semana de la práctica ya está
   * anclada en `America/Mexico_City`, y una segunda definición de hoy haría que el botón y el conteo
   * discreparan al filo de la medianoche.
   */
  async pillarsPractisedToday(
    userId: string | null,
    now: Date = new Date(),
  ): Promise<ReadonlySet<PillarKey>> {
    if (!userId) return new Set();
    return this.repository.pillarsPractisedOn(
      userId,
      localDateAt(now, COMMUNITY_TIMEZONE),
    );
  }

  /**
   * El tablero personal de la semana, por pilar.
   *
   * Sale de `habit_repetitions` y no de la ventana guardada del reto: una ventana vieja puede estar
   * cerrada y seguir existiendo, pero el tablero responde otra pregunta —qué pasó esta semana de la
   * comunidad—, la misma que mira el jardín.
   */
  async weeklyPillarProgress(
    userId: string | null,
    now: Date = new Date(),
  ): Promise<readonly WeeklyPillarPracticeProgress[]> {
    if (!userId) return emptyWeeklyProgress(new Set(), new Map());

    const week = currentCommunityWeek(now);
    const today = localDateAt(now, COMMUNITY_TIMEZONE);
    const [countedToday, weeklyCounts] = await Promise.all([
      this.repository.pillarsPractisedOn(userId, today),
      this.repository.pillarRepetitionsBetween(
        userId,
        week.startDate,
        week.endDate,
      ),
    ]);

    return emptyWeeklyProgress(countedToday, weeklyCounts);
  }
}

function emptyWeeklyProgress(
  countedToday: ReadonlySet<PillarKey>,
  weeklyCounts: ReadonlyMap<PillarKey, number>,
): readonly WeeklyPillarPracticeProgress[] {
  return PILLAR_KEYS.map((pillar) => ({
    pillar,
    completedDays: weeklyCounts.get(pillar) ?? 0,
    countedToday: countedToday.has(pillar),
  }));
}
