import type { MessageKeys, Messages, NestedKeyOf } from "next-intl";

type AnimationMessages = Messages["pillarAnimations"];

/**
 * Un texto del catálogo `pillarAnimations` (`overview.sleep.b1`, `sleep.cost.chip`). El compilador
 * comprueba que exista, así que una clave mal escrita en un guion no llega a producción.
 */
export type AnimationMessageKey = MessageKeys<
  AnimationMessages,
  NestedKeyOf<AnimationMessages>
>;
