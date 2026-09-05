/**
 * La forma de una práctica en la semilla.
 *
 * Vive aparte de las listas para que cada pilar tenga su propio módulo y ninguno arrastre a los
 * otros: son cuatro cuerpos de contenido independientes que sólo comparten esta forma.
 */
import type { PillarKey } from "~/domain/pillars/pillarKey";

export type PracticeTranslationSeed = {
  title: string;
  /** La promesa en una frase. Es lo que los estudios ligados sostienen. */
  summary: string;
  /**
   * Cuándo y dónde: la intención de implementación.
   *
   * Es la primera ley —hacerlo obvio— y lo que separa un consejo de un hábito. «Penumbra total» es
   * un buen consejo; «al apagar la luz, mirando qué sigue encendido» es una práctica.
   *
   * Nunca una hora del reloj: la luz disponible y los horarios cambian con el lugar y la temporada,
   * y ése fue el argumento por el que el primer ritual se negó a fijar «a las 6 p. m.». Un ancla es
   * un momento de la vida de alguien.
   */
  cue?: string;
  howTo?: string;
  /**
   * Qué basta para que la repetición cuente.
   *
   * Se omite cuando la práctica **ya es mínima** —una infusión no tiene una versión más pequeña— y
   * se escribe cuando es compuesta. Ausente no significa «no tiene mínimo»: significa que la
   * práctica entera lo es.
   */
  minimum?: string;
  /** La advertencia que tiene que viajar con la práctica cuando llega sola a un chat. */
  safetyNote?: string;
};

export type PracticeSeed = {
  key: string;
  /** Sólo las cuatro prácticas que además son un reto atómico la llevan. */
  challengeKey?: string;
  effortMinutes?: number;
  /** 0 gratis · 1 poco · 2 compra. */
  costLevel: number;
  /** El primero de la lista es el primario: el pilar que la lleva en su portada. */
  pillars: readonly PillarKey[];
  /** DOIs sin el prefijo `https://doi.org/`. Vacío significa que ninguno de los 116 la sostiene. */
  dois: readonly string[];
  es: PracticeTranslationSeed;
  en: PracticeTranslationSeed;
};
