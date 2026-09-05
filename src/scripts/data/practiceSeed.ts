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
  howTo?: string;
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
