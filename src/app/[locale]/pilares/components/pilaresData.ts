/**
 * La estructura de los cuatro pilares: su dirección, su número y su color.
 *
 * **No contiene texto.** El mismo reparto que en `postOriginLabels`: el vocabulario es código
 * —añadir un pilar es editar esta lista— y la redacción es traducción. Cada pilar apunta a su
 * clave del catálogo y el texto lo pone quien traduce.
 */
export type PillarKey = "sleep" | "nutrition" | "movement" | "mindSpirit";

export interface PillarData {
  /** El segmento de la URL. Se queda en español mientras las rutas no se localicen (slice 4). */
  slug: string;
  /** La clave bajo la que vive su texto, en `pillars` y en `pillarPages`. */
  key: PillarKey;
  number: number;
  color: "violet" | "orange" | "emerald" | "sky";
  colorHex: string;
}

export const PILLARS: PillarData[] = [
  {
    slug: "sueno",
    key: "sleep",
    number: 1,
    color: "violet",
    colorHex: "#8b5cf6",
  },
  {
    slug: "alimentacion",
    key: "nutrition",
    number: 2,
    color: "orange",
    colorHex: "#f0380e",
  },
  {
    slug: "movimiento",
    key: "movement",
    number: 3,
    color: "emerald",
    colorHex: "#5DBF17",
  },
  {
    slug: "mente-espiritu",
    key: "mindSpirit",
    number: 4,
    color: "sky",
    colorHex: "#38bdf8",
  },
];

export interface PillarColorClasses {
  text: string;
  bg: string;
  border: string;
  badge: string;
  hover: string;
}

export const pillarColorClasses: Record<string, PillarColorClasses> = {
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-800/40",
    badge: "bg-violet-500",
    hover:
      "hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-violet-200/50 dark:hover:shadow-violet-900/30",
  },
  orange: {
    text: "text-pw-orange",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800/40",
    badge: "bg-pw-orange",
    hover:
      "hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30",
  },
  emerald: {
    text: "text-pw-lightgreen",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    badge: "bg-pw-lightgreen",
    hover:
      "hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30",
  },
  sky: {
    text: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800/40",
    badge: "bg-sky-400",
    hover:
      "hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-sky-200/50 dark:hover:shadow-sky-900/30",
  },
};
