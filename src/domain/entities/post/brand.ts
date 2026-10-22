/**
 * La marca de lo que se vende («Birdman», «Amarosana»). Es un dato genérico de comercio: cualquier
 * giro vende marcas, así que no sabe de comida.
 *
 * «Sin marca» es `null`, nunca una cadena vacía: la base lo exige (`posts_brand_not_blank`) para que
 * agrupar no junte productos bajo una marca en blanco.
 */

/** Lo más largo que se acepta. Una marca es un nombre, no una descripción. */
export const BRAND_MAX_LENGTH = 60;

export type BrandError = "brand-too-long";

/**
 * La marca como se guarda: sin espacios a los lados ni repetidos por dentro. Vacía o solo espacios
 * es `null`. No cambia mayúsculas: «Birdman» se escribe como lo escribe quien la vende.
 */
export function normalizeBrand(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const brand = raw.trim().replace(/\s+/g, " ");

  return brand === "" ? null : brand;
}

/** Ya normalizada. `null` siempre es válida: no tener marca es lo normal. */
export function validateBrand(brand: string | null): BrandError | null {
  if (brand !== null && brand.length > BRAND_MAX_LENGTH) {
    return "brand-too-long";
  }

  return null;
}

/**
 * Con qué se compara una marca para agrupar o filtrar: «Birdman» y «birdman» son la misma. Es la
 * misma regla que el índice de la base, que va sobre `lower(brand)`.
 */
export function brandKey(brand: string): string {
  return brand.toLocaleLowerCase("es");
}
