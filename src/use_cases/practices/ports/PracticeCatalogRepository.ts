import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PracticeCard } from "~/domain/practices/practiceCard";

/** De dónde sale el catálogo de prácticas publicadas, ya traducido y con su evidencia contada. */
export interface PracticeCatalogRepository {
  listPublished(locale: string): Promise<readonly PracticeCard[]>;
  /**
   * El pilar del que una práctica es portada, o `null` si la clave no existe o no está publicada.
   *
   * Lo pide el conteo: la unidad de este producto es el **pilar y el día**, así que marcar una
   * práctica necesita saber a qué pilar apuntar la repetición. Se resuelve contra la base y no
   * contra lo que mande el formulario.
   */
  findPrimaryPillar(practiceKey: string): Promise<PillarKey | null>;
}
