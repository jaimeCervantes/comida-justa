import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { primaryPillarOf } from "~/domain/practices/practiceCard";
import type {
  PillarTheme,
  PracticeCatalogRepository,
} from "./ports/PracticeCatalogRepository";

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

  /** Los temas del catálogo de un pilar. Vacío significa que ese pilar no tiene catálogo. */
  async listThemes(
    pillar: PillarKey,
    locale: string,
  ): Promise<readonly PillarTheme[]> {
    return this.repository.listThemes(pillar, locale);
  }

  /**
   * El pilar del que una práctica es portada.
   *
   * Lo pide el conteo del día: la unidad es el pilar, y a cuál apunta una repetición se decide
   * contra la base y no contra lo que mande un formulario.
   */
  async primaryPillarOf(practiceKey: string): Promise<PillarKey | null> {
    return this.repository.findPrimaryPillar(practiceKey);
  }

  /**
   * Las prácticas que alguien lleva, ya con su título y su ancla.
   *
   * Compone las dos lecturas que ya existen en vez de escribir una consulta nueva: el catálogo
   * (memorizado por petición) trae el texto y el conjunto de adoptadas trae las claves. Una tercera
   * consulta que uniera `user_practices` con `practice_translations` diría lo mismo con otro SQL que
   * mantener, y se desincronizaría el día que el catálogo cambie de orden o de idioma de respaldo.
   */
  async listAdopted(
    locale: string,
    adopted: ReadonlySet<string>,
  ): Promise<readonly PracticeCard[]> {
    if (adopted.size === 0) return [];
    const practices = await this.repository.listPublished(locale);
    return practices.filter(({ key }) => adopted.has(key));
  }

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
