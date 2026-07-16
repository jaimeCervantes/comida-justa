export interface PillarData {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  color: "violet" | "orange" | "emerald" | "sky";
  colorHex: string;
}

export const PILLARS: PillarData[] = [
  {
    slug: "sueno",
    number: 1,
    title: "Sueño y Descanso",
    subtitle: "La base de la recuperación biológica y la salud a largo plazo.",
    description:
      "El sueño no es un lujo, es la base fisiológica de la atención, la memoria, la estabilidad emocional, el metabolismo, la inmunidad y la salud cardiovascular. Optimizar la higiene del sueño es el primer paso para que el cuerpo y la mente se reparen adecuadamente.",
    color: "violet",
    colorHex: "#8b5cf6",
  },
  {
    slug: "alimentacion",
    number: 2,
    title: "Alimentación natural y nutritiva",
    subtitle: "Reconectando con el origen y la comida real.",
    description:
      "Más allá de una dieta, este pilar promueve el consumo de alimentos reales, mínimamente procesados, variados y de origen local. Facilita el puente entre agricultores y consumidores, y crea un entorno donde elegir comida sana sea la opción más sencilla.",
    color: "orange",
    colorHex: "#f0380e",
  },
  {
    slug: "movimiento",
    number: 3,
    title: "Movimiento y ejercicio",
    subtitle: "Combatiendo el sedentarismo en la vida diaria.",
    description:
      "No se limita al gimnasio: abarca caminar, correr, jugar o cualquier forma de movimiento funcional. El objetivo es integrar la actividad física en la vida diaria y encontrar placer en el esfuerzo físico para mantenerlo de forma constante.",
    color: "emerald",
    colorHex: "#5DBF17",
  },
  {
    slug: "mente-espiritu",
    number: 4,
    title: "Emociones, Mente, Espíritu y Comunidad",
    subtitle: "Reconectando con nosotros mismos y nuestra tribu.",
    description:
      "La salud no es solo física. Este pilar se centra en la gestión emocional, la claridad mental, la conexión con los demás y el sentido de propósito. Cultivar relaciones sanas y sentirnos parte de algo más grande impulsa los otros tres pilares.",
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
