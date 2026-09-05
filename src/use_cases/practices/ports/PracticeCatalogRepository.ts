import type { PracticeCard } from "~/domain/practices/practiceCard";

/** De dónde sale el catálogo de prácticas publicadas, ya traducido y con su evidencia contada. */
export interface PracticeCatalogRepository {
  listPublished(locale: string): Promise<readonly PracticeCard[]>;
}
