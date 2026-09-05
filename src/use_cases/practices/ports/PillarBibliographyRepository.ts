import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { StudyCitation } from "~/domain/practices/study";

/**
 * De dónde sale el cuerpo de evidencia de un pilar.
 *
 * Devuelve los estudios en el orden en que la bibliografía se construyó —agrupada por tema, ni
 * alfabética ni por año— y cada uno ya sabe qué prácticas sostiene, en el idioma pedido.
 */
export interface PillarBibliographyRepository {
  listByPillar(
    pillar: PillarKey,
    locale: string,
  ): Promise<readonly StudyCitation[]>;
}
