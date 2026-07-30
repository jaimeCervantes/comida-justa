import type { PostOrigin } from "./origin";

/**
 * Reglas para traer el catálogo del chatbot (`products`) a `posts`. Viven en el dominio porque
 * son decisiones de negocio, no de acceso a datos: qué origen se les asigna, cómo se traduce una
 * etiqueta heredada a la clave del catálogo y cómo se arma el contacto de WhatsApp.
 *
 * Los 9 productos son del menú de Hazlo Sano, producidos por ellos mismos.
 */
export const LEGACY_PRODUCT_ORIGIN: PostOrigin = "hazlo_sano_propio";

const MEXICO_COUNTRY_CODE = "52";

/** Marcas de acento que deja `normalize("NFD")` al separar la letra base de su diacrítico. */
const DIACRITICS = /[̀-ͯ]/g;

/**
 * `products` guarda la etiqueta visible ("Alimentación", "Jugos") y `posts` guarda la clave
 * ("alimentacion", "jugos").
 *
 * **No es lo mismo que `normalizeCategoryKey`** de `taxonomy.ts`: aquella conserva espacios y
 * signos interiores para coincidir exactamente con la función SQL `category_normalize`, mientras
 * que esta los elimina, porque `products` guarda texto libre escrito a mano. Fundirlas rompería
 * la simetría entre el TypeScript y la base.
 */
export function legacyLabelToKey(label: string | null | undefined): string | null {
  if (!label) return null;

  const key = label
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "");

  return key || null;
}

const OUTDATED =
  "migrateProductsToPosts.ts está desactualizado: la taxonomía ahora vive en la tabla " +
  "`categories`. Usa getCategoryTaxonomy() + resolveKeyLenient antes de volver a correr " +
  "`pnpm run migrate:products`.";

/**
 * @deprecated La taxonomía dejó de vivir en constantes: resolver una etiqueta heredada exige leer
 * la base (`getCategoryTaxonomy()` + `resolveKeyLenient`), lo que vuelve asíncrona esta operación.
 * No se migró porque la tabla `products` quedó fuera de alcance y sus datos ya viven en `posts`.
 *
 * Conserva su firma para que `src/scripts/migrateProductsToPosts.ts` siga compilando sin tocarlo,
 * pero **lanza**: devolver `null` migraría los productos sin categoría y en silencio, que es
 * justo el modo de fallo mudo que la tabla vino a eliminar.
 */
export function legacyCategory(label: string | null | undefined): string | null {
  void label;
  throw new Error(OUTDATED);
}

/** @deprecated Ver {@link legacyCategory}. */
export function legacySubCategory(label: string | null | undefined): string | null {
  void label;
  throw new Error(OUTDATED);
}

/**
 * El teléfono del vendedor se guarda a 10 dígitos y el enlace de WhatsApp necesita lada de país.
 * Si el número ya la trae, se respeta tal cual.
 */
export function legacyWhatsapp(
  phone: string | null | undefined,
): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");

  if (!digits) return null;

  return digits.startsWith(MEXICO_COUNTRY_CODE)
    ? digits
    : `${MEXICO_COUNTRY_CODE}${digits}`;
}
