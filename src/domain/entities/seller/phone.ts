import { SellerPhoneInvalidError } from "./errors";

const MEXICO_COUNTRY_CODE = "52";
const NATIONAL_NUMBER_LENGTH = 10;

/**
 * Deja el teléfono en los 10 dígitos con que `sellers.phone` guarda el único número que ya
 * existe (`2781126948`).
 *
 * Normalizar **antes** de consultar es lo que hace útil al índice único de la columna: sin esto,
 * `+52 278 112 6948` y `2781126948` serían dos vendedores distintos con el mismo teléfono, y el
 * mensaje "ese teléfono ya está registrado" nunca aparecería.
 */
export function normalizeSellerPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");

  const national =
    digits.length > NATIONAL_NUMBER_LENGTH &&
    digits.startsWith(MEXICO_COUNTRY_CODE)
      ? digits.slice(MEXICO_COUNTRY_CODE.length)
      : digits;

  if (national.length !== NATIONAL_NUMBER_LENGTH) {
    throw new SellerPhoneInvalidError();
  }

  return national;
}
