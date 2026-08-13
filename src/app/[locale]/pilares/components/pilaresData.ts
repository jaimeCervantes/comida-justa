/**
 * La estructura de los cuatro pilares: su dirección, su número y su color.
 *
 * **No contiene texto.** El mismo reparto que en `postOriginLabels`: el vocabulario es código
 * —añadir un pilar es editar esta lista— y la redacción es traducción. Cada pilar apunta a su
 * clave del catálogo y el texto lo pone quien traduce.
 */
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

export type PillarKey = "sleep" | "nutrition" | "movement" | "mindSpirit";

export interface PillarData {
  /** El segmento de la URL. Se queda en español mientras las rutas no se localicen (slice 4). */
  slug: string;
  /** La clave bajo la que vive su texto, en `pillars` y en `pillarPages`. */
  key: PillarKey;
  number: number;
}

export const PILLARS: PillarData[] = [
  { slug: "sueno", key: "sleep", number: 1 },
  { slug: "alimentacion", key: "nutrition", number: 2 },
  { slug: "movimiento", key: "movement", number: 3 },
  { slug: "mente-espiritu", key: "mindSpirit", number: 4 },
];

/**
 * El mismo pilar visto desde el reto (`mind`) y desde la presentación (`mindSpirit`).
 *
 * Son dos vocabularios de verdad —el dominio de hábitos nombra el reto, esta lista nombra el
 * artículo— y solo difieren en el cuarto. Hasta ahora cada página resolvía la equivalencia a mano
 * pasando las dos claves como literales (`challenge="mind"` junto a `pillar="mindSpirit"`), que
 * funciona mientras nadie se equivoque de fila. Escrita una vez, un componente que reciba el reto
 * puede sacar el color sin que quien lo monte tenga que acordarse.
 */
export const PILLAR_KEY_BY_CHALLENGE: Record<
  HabitChallengeExperienceKey,
  PillarKey
> = {
  sleep: "sleep",
  nutrition: "nutrition",
  movement: "movement",
  mind: "mindSpirit",
};

export interface PillarColorClasses {
  /** Tinta del pilar: títulos y texto de acento. */
  text: string;
  /** Fondo tenue: tarjetas y cajas destacadas. */
  bg: string;
  /** Borde a juego con la tinta. */
  border: string;
  /** Relleno saturado; siempre lleva texto blanco encima. */
  badge: string;
  /** Realce al pasar el cursor por una tarjeta enlazada. */
  hover: string;
  /** Enlaces de la lista de referencias. */
  link: string;
}

/**
 * Las clases de cada pilar, todas apoyadas en los tokens `--pillar-*` del design system.
 *
 * **Ya no hay variantes `dark:`.** Antes cada clase venía en pareja (`text-violet-600
 * dark:text-violet-400`) y había que acordarse de las dos; ahora el token cambia solo de valor
 * según el tema y la clase es una. Eso es también lo que arregló la podredumbre que había aquí:
 * un find/replace anterior había dejado `da dark:` como clase suelta, `bg-violet-50/da` y
 * `text-violet-100xt-lg` en las páginas, y nadie lo vio porque cada página escribía su color a mano.
 *
 * Sueño y Mente usaban `violet` y `sky`, que no son colores de Hazlo Sano. Ahora los cuatro salen
 * de la marca: Alimentación de `--brand-orange`, Movimiento de `--brand-lightgreen` y Mente de
 * `--brand-lightorange`; solo Sueño estrena tono. El contraste de cada par está verificado en
 * `pillarPalette.contrast.test.ts`.
 *
 * Los nombres de token van en kebab-case (`mind-spirit`) porque Tailwind no es fiable con
 * mayúsculas dentro de una clase; la clave del pilar sigue en camelCase.
 */
export const pillarColorClasses: Record<PillarKey, PillarColorClasses> = {
  sleep: {
    text: "text-pillar-sleep-ink",
    bg: "bg-pillar-sleep-soft",
    border: "border-pillar-sleep-ink/30",
    badge: "bg-pillar-sleep-solid",
    hover: "hover:border-pillar-sleep-ink/60",
    link: "text-pillar-sleep-ink underline transition-opacity hover:opacity-75",
  },
  nutrition: {
    text: "text-pillar-nutrition-ink",
    bg: "bg-pillar-nutrition-soft",
    border: "border-pillar-nutrition-ink/30",
    badge: "bg-pillar-nutrition-solid",
    hover: "hover:border-pillar-nutrition-ink/60",
    link: "text-pillar-nutrition-ink underline transition-opacity hover:opacity-75",
  },
  movement: {
    text: "text-pillar-movement-ink",
    bg: "bg-pillar-movement-soft",
    border: "border-pillar-movement-ink/30",
    badge: "bg-pillar-movement-solid",
    hover: "hover:border-pillar-movement-ink/60",
    link: "text-pillar-movement-ink underline transition-opacity hover:opacity-75",
  },
  mindSpirit: {
    text: "text-pillar-mind-spirit-ink",
    bg: "bg-pillar-mind-spirit-soft",
    border: "border-pillar-mind-spirit-ink/30",
    badge: "bg-pillar-mind-spirit-solid",
    hover: "hover:border-pillar-mind-spirit-ink/60",
    link: "text-pillar-mind-spirit-ink underline transition-opacity hover:opacity-75",
  },
};
