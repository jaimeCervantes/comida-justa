/**
 * La clave de un pilar: el vocabulario con el que el pilar se nombra a sí mismo.
 *
 * Vivía en `src/app/[locale]/pilares/components/pilaresData.ts`, que es capa de presentación, y
 * ahora la necesitan el dominio, el caso de uso y la tabla `pillars`. Un tipo del que dependen las
 * capas de dentro no puede vivir en la de fuera, así que se mudó aquí y `pilaresData.ts` lo
 * reexporta para no tocar los veinte sitios que ya lo importaban de allí.
 *
 * **Es `mindSpirit` y no `mind`.** Son dos vocabularios de verdad, no un descuido: el dominio de
 * hábitos nombra el reto (`mind`) y esta lista nombra el pilar (`mindSpirit`). La equivalencia vive
 * escrita una sola vez, en `PILLAR_KEY_BY_CHALLENGE`, y la tabla usa la del pilar porque de pilares
 * habla.
 */
export type PillarKey = "sleep" | "nutrition" | "movement" | "mindSpirit";
