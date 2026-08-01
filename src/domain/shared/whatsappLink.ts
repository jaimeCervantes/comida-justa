const MEXICO_COUNTRY_CODE = "52";

/**
 * El número tal como lo quiere `wa.me`: solo dígitos y con lada de país.
 *
 * La base guarda las dos formas —`contact_phone` a 10 dígitos, `contact_whatsapp` ya con el 52—
 * porque vienen de caminos distintos (el formulario y la migración del catálogo del bot). Aquí se
 * unifican. Si el número ya trae la lada, se respeta.
 */
export function toWhatsappNumber(
  phone: string | null | undefined,
): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");

  if (!digits) return null;

  return digits.startsWith(MEXICO_COUNTRY_CODE)
    ? digits
    : `${MEXICO_COUNTRY_CODE}${digits}`;
}

/**
 * El enlace de WhatsApp con el mensaje ya escrito, o `null` si no hay número utilizable.
 *
 * Devolver `null` es la regla: quien lo pinta no debe ofrecer un enlace roto, y así la decisión
 * de "no hay botón" se toma en un solo lugar en vez de en cada pantalla.
 */
export function whatsappLink(
  phone: string | null | undefined,
  message: string,
): string | null {
  const number = toWhatsappNumber(phone);

  if (!number) return null;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
