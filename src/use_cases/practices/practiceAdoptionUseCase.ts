import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";
import { activeKeys } from "~/domain/practices/adoption";
import type { PracticeAdoptionRepository } from "./ports/PracticeAdoptionRepository";

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
}
