/**
 * De dónde / quién ofrece el producto. Se persiste como `text` (no enum de BD) y se valida
 * contra esta allowlist, de modo que agregar un valor nuevo = editar esta constante, sin migración.
 *
 * Patrón `{rol}_{ámbito}`:
 *   rol   ∈ hazlo_sano | productor | reventa
 *   ámbito ∈ propio | local | foraneo
 */
export const POST_ORIGINS = [
  "hazlo_sano_propio",
  "hazlo_sano_reventa",
  "productor_local",
  "reventa_local",
  "productor_foraneo",
  "reventa_foranea",
] as const;

export type PostOrigin = (typeof POST_ORIGINS)[number];

/** Prefijo de los orígenes que afirman que Hazlo Sano es el vendedor (solo admin puede asignarlos). */
export const HAZLO_SANO_ORIGIN_PREFIX = "hazlo_sano_";

const LOCAL_ORIGINS: readonly PostOrigin[] = [
  "productor_local",
  "reventa_local",
];

export function isValidOrigin(value: unknown): value is PostOrigin {
  return (
    typeof value === "string" &&
    (POST_ORIGINS as readonly string[]).includes(value)
  );
}

/** ¿El origen afirma que lo vende Hazlo Sano? (propio o reventa). */
export function isHazloSanoOrigin(value: string | null | undefined): boolean {
  return (
    typeof value === "string" && value.startsWith(HAZLO_SANO_ORIGIN_PREFIX)
  );
}

/**
 * Quién **produce** en la zona.
 *
 * Es el filtro del directorio de productores locales, y por eso mira solo el rol `productor` con
 * ámbito `local`: la sección existe para destacar a quien **hace** lo que vende, no a quien lo
 * revende —ese también es un negocio del pueblo, y aparece en el directorio de negocios—.
 */
export function isLocalProducerOrigin(
  value: string | null | undefined,
): boolean {
  return value === "productor_local";
}

/** ¿El origen es de un productor/revendedor local? */
export function isLocalOrigin(value: string | null | undefined): boolean {
  return (
    typeof value === "string" &&
    (LOCAL_ORIGINS as readonly string[]).includes(value)
  );
}

/** Los orígenes `hazlo_sano_*` solo puede asignarlos un admin. */
export function isAdminOnlyOrigin(value: string | null | undefined): boolean {
  return isHazloSanoOrigin(value);
}

/**
 * Normaliza el `origin` recibido de un request según el rol del autor. Es la defensa en servidor:
 * - vacío/nulo → `null` (sin especificar)
 * - valor inválido (fuera de la allowlist) → `null`
 * - valor `hazlo_sano_*` pedido por un no-admin → `null` (se ignora)
 * - en cualquier otro caso → el valor válido tal cual
 */
export function resolveOriginForUser(
  raw: string | null | undefined,
  isAdmin: boolean,
): PostOrigin | null {
  if (!raw) return null;
  if (!isValidOrigin(raw)) return null;
  if (isAdminOnlyOrigin(raw) && !isAdmin) return null;
  return raw;
}
