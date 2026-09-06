import type { LocalDate } from "~/domain/habits/habitChallenge";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";

/** Dónde vive lo que cada persona practica. */
export interface PracticeAdoptionRepository {
  listFor(userId: string): Promise<readonly PracticeAdoption[]>;
  /** Prácticas activas que la persona eligió enseñar en su perfil público. */
  listSharedActiveFor(userId: string): Promise<readonly PracticeAdoption[]>;
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
  /**
   * Decide si una práctica activa puede aparecer en el perfil público de la persona.
   *
   * La práctica sigue activa en ambos casos: compartir es una decisión de visibilidad, no una forma
   * de empezar ni dejar.
   */
  setSharing(
    userId: string,
    practiceKey: string,
    enabled: boolean,
  ): Promise<void>;
  /**
   * Los pilares que esta persona ya marcó en una fecha.
   *
   * Devuelve **pilares y no prácticas** porque ésa es la unidad de conteo: una repetición es «hoy
   * practiqué el descanso», y marcar doce prácticas de descanso sigue siendo un día. La interfaz lo
   * enseña tal cual, y así la regla se aprende usándola en vez de leyéndola.
   */
  pillarsPractisedOn(
    userId: string,
    cycleDate: LocalDate,
  ): Promise<ReadonlySet<PillarKey>>;

  /**
   * Cuántos días cuentan por pilar dentro de una ventana `[startDate, endDate)`.
   *
   * Lee la misma unidad que el jardín: una fila de `habit_repetitions` ya está limitada por persona,
   * reto y fecha, así que el número es "días del pilar", no casillas apretadas.
   */
  pillarRepetitionsBetween(
    userId: string,
    startDate: LocalDate,
    endDate: LocalDate,
  ): Promise<ReadonlyMap<PillarKey, number>>;
}
