import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { primaryPillarOf } from "~/domain/practices/practiceCard";
import type { PracticeCatalogRepository } from "./ports/PracticeCatalogRepository";

/** Las prácticas de un pilar, con el pilar delante para que la página no tenga que agrupar. */
export type PillarPractices = {
  pillar: PillarKey;
  practices: readonly PracticeCard[];
};

export default class PracticeCatalogUseCase {
  constructor(private readonly repository: PracticeCatalogRepository) {}

  /**
   * El catálogo agrupado por pilar, respetando el orden en que la base los devuelve.
   *
   * Agrupa aquí y no en la página porque es una decisión de lectura —una práctica aparece bajo el
   * pilar del que es portada, y una sola vez, aunque sirva a tres— y ese «una sola vez» es
   * exactamente lo que el modelo N:N compró. Repetirla por pilar contaría como tres lo que es una.
   *
   * **No inventa pilares vacíos.** Un pilar sin prácticas sembradas no aparece, en vez de pintar un
   * encabezado con nada debajo.
   */
  async listByPillar(locale: string): Promise<readonly PillarPractices[]> {
    const practices = await this.repository.listPublished(locale);
    const groups = new Map<PillarKey, PracticeCard[]>();

    for (const practice of practices) {
      const pillar = primaryPillarOf(practice);
      const group = groups.get(pillar);
      if (group) group.push(practice);
      else groups.set(pillar, [practice]);
    }

    return [...groups].map(([pillar, group]) => ({
      pillar,
      practices: group,
    }));
  }
}
