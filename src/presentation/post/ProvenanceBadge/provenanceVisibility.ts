import {
  isHazloSanoOrigin,
  isHazloSanoOwnMadeOrigin,
} from "~/domain/entities/post/origin";

/**
 * ¿Se pinta la insignia de procedencia?
 *
 * La regla es **"no lo digas dos veces"**, no "el origen dejó de importar". Un origen
 * `hazlo_sano_reventa` pinta "🌿 Hazlo Sano", que es exactamente lo que ya dicen el logo y el
 * nombre de la tienda a treinta píxeles de ahí — ahí sí se calla. Los demás orígenes se quedan: que
 * lo haga quien lo vende (`productor`), que lo consiguiera cerca (`reventa_cercana`) o que Hazlo
 * Sano lo haga ella misma (`hazlo_sano_propio`, que ahora pinta "📍 Local" y no la marca) son
 * afirmaciones que ninguna imagen puede hacer, y son la razón de ser del directorio de productores.
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
  const duplicatesStoreIdentity =
    isHazloSanoOrigin(origin) && !isHazloSanoOwnMadeOrigin(origin);

  return !(hasStoreIdentity && duplicatesStoreIdentity);
}
