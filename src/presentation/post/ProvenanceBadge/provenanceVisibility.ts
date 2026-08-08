import { isHazloSanoOrigin } from "~/domain/entities/post/origin";

/**
 * ¿Se pinta la insignia de procedencia?
 *
 * La regla es **"no lo digas dos veces"**, no "el origen dejó de importar". Un origen
 * `hazlo_sano_*` pinta "🌿 Hazlo Sano", que es exactamente lo que ya dicen el logo y el nombre de
 * la tienda a treinta píxeles de ahí. Los demás orígenes se quedan: que lo haga quien lo vende
 * (`productor`) o que lo consiguiera cerca (`reventa_cercana`) son afirmaciones que ninguna imagen
 * puede hacer, y son la razón de ser del directorio de productores.
 *
 * Depende de `hasStoreIdentity` y no solo del origen porque sin tienda al lado no hay nada que
 * duplique: ahí la insignia vuelve a ser la única que lo dice.
 *
 * Vive en `presentation/` y no junto a la ficha porque la tarjeta de listado hace la misma
 * pregunta desde que también enseña el logo: la regla es una y el sitio donde se aplica, dos.
 */
export function showsProvenanceBadge(
  origin: string | null | undefined,
  hasStoreIdentity: boolean,
): boolean {
  return !(hasStoreIdentity && isHazloSanoOrigin(origin));
}
