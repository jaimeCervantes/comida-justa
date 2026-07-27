import {
  resolveCategory,
  resolveSubCategory,
  type PostCategory,
  type PostSubCategory,
} from "./category";
import type { PostOrigin } from "./origin";

/**
 * Reglas para traer el catálogo del chatbot (`products`) a `posts`. Viven en el dominio porque
 * son decisiones de negocio, no de acceso a datos: qué origen se les asigna, cómo se traduce una
 * etiqueta heredada a la clave de la allowlist y cómo se arma el contacto de WhatsApp.
 *
 * Los 9 productos son del menú de Hazlo Sano, producidos por ellos mismos.
 */
export const LEGACY_PRODUCT_ORIGIN: PostOrigin = "hazlo_sano_propio";

const MEXICO_COUNTRY_CODE = "52";

/** Marcas de acento que deja `normalize("NFD")` al separar la letra base de su diacrítico. */
const DIACRITICS = /[̀-ͯ]/g;

/**
 * `products` guarda la etiqueta visible ("Alimentación", "Jugos") y `posts` guarda la clave
 * ("alimentacion", "jugos"). Se normaliza quitando acentos y bajando a minúsculas; lo que no
 * caiga en la allowlist se queda sin categoría en vez de inventar una clave nueva.
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

export function legacyCategory(
  label: string | null | undefined,
): PostCategory | null {
  return resolveCategory(legacyLabelToKey(label));
}

/**
 * Renombres de la allowlist que la normalización por sí sola ya no alcanza.
 *
 * `products` guarda la etiqueta vieja "Comidas", que normaliza a `comidas`; esa clave se renombró
 * a `platillos`. Sin este alias, volver a correr la migración dejaría esos productos sin
 * subcategoría en vez de clasificarlos, y el fallo sería mudo: `resolveSubCategory` devuelve
 * `null` por diseño, no lanza. Se resuelve aquí y no en la allowlist porque es deuda del catálogo
 * heredado, y muere el día que se elimine la tabla `products`.
 */
const LEGACY_SUB_CATEGORY_ALIASES: Readonly<Record<string, PostSubCategory>> = {
  comidas: "platillos",
};

export function legacySubCategory(
  label: string | null | undefined,
): PostSubCategory | null {
  const key = legacyLabelToKey(label);

  if (!key) return null;

  return resolveSubCategory(LEGACY_SUB_CATEGORY_ALIASES[key] ?? key);
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
