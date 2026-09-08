import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { StudyCitation } from "~/domain/practices/study";
import type { PillarBibliographyRepository } from "./ports/PillarBibliographyRepository";

/**
 * El cuerpo de evidencia de un pilar, listo para pintarse.
 *
 * **Nunca falla por estar vacío.** Una bibliografía sin filas es una siembra pendiente, no un 404:
 * la página del pilar existe por su ritual, y quedarse sin referencias degrada la lectura pero no
 * la rompe. Es la misma regla que ya sigue `readPillarLocal` con las tiendas de la zona.
 */
export default class PillarBibliographyUseCase {
  constructor(private readonly repository: PillarBibliographyRepository) {}

  async listFor(
    pillar: PillarKey,
    locale: string,
  ): Promise<readonly StudyCitation[]> {
    return this.repository.listByPillar(pillar, locale);
  }

  /**
   * Cuántos de los estudios del pilar sostienen alguna práctica.
   *
   * Es el número que hace honesta a la sección: de los cuarenta y tres del descanso, trece dicen
   * qué hacer y el resto explica por qué existe el pilar. Enseñarlo evita la lectura de que toda la
   * bibliografía respalda cada consejo, que es justo la autoridad prestada que este catálogo vino a
   * deshacer.
   */
  static countSupporting(studies: readonly StudyCitation[]): number {
    return studies.filter((study) => study.supports.length > 0).length;
  }
}
