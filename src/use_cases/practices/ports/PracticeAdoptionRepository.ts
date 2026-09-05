import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";

/** Dónde vive lo que cada persona practica. */
export interface PracticeAdoptionRepository {
  listFor(userId: string): Promise<readonly PracticeAdoption[]>;
  /**
   * Empieza una práctica, o **reabre** la que se había dejado.
   *
   * Devuelve `false` cuando la clave no existe o la práctica no está publicada: la página no debe
   * poder inscribir a nadie en algo que no está en el catálogo, aunque le manden la clave a mano.
   */
  start(
    userId: string,
    practiceKey: string,
    source: PracticeSource,
  ): Promise<boolean>;
  stop(userId: string, practiceKey: string): Promise<void>;
}
