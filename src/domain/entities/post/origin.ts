/**
 * Quién ofrece el producto. Se persiste como `text` (no enum de BD) y se valida contra esta
 * allowlist, de modo que agregar un valor nuevo = editar esta constante, sin migración.
 *
 * **El eje `ámbito` solo existe para la reventa, y es a propósito.** Local o lejano no es opinión
 * del vendedor, es una distancia (ver `src/domain/entities/seller/proximity.ts`), y hay una
 * asimetría que decide el modelo:
 *
 * - Si lo **produce** quien lo vende, viene de donde está su tienda: las coordenadas de su sucursal
 *   lo contestan solas. Preguntárselo es invitarlo a equivocarse, así que no se le pregunta.
 * - Si lo **revende**, el producto viajó desde otra parte y sus coordenadas no dicen nada de eso.
 *   Solo él sabe de dónde lo trajo, así que ahí sí hay que preguntar.
 */
export const PRODUCER_ORIGIN = "productor";

export const POST_ORIGINS = [
  "hazlo_sano_propio",
  "hazlo_sano_reventa",
  PRODUCER_ORIGIN,
  "reventa_cercana",
  "reventa_lejana",
] as const;

export type PostOrigin = (typeof POST_ORIGINS)[number];

/** Prefijo de los orígenes que afirman que Hazlo Sano es el vendedor (solo admin puede asignarlos). */
export const HAZLO_SANO_ORIGIN_PREFIX = "hazlo_sano_";

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
 * ¿Lo hace quien lo vende?
 *
 * Es la mitad del filtro del directorio de productores; la otra mitad es la distancia, y esa no se
 * puede contestar aquí porque no vive en el post sino en la sucursal de su tienda.
 */
export function isProducerOrigin(value: string | null | undefined): boolean {
  return value === PRODUCER_ORIGIN;
}

/** ¿El vendedor declaró que lo consiguió cerca? Es lo único que la insignia puede afirmar sola. */
export function isNearbyResaleOrigin(
  value: string | null | undefined,
): boolean {
  return value === "reventa_cercana";
}

/** Los orígenes `hazlo_sano_*` solo puede asignarlos un admin. */
export function isAdminOnlyOrigin(value: string | null | undefined): boolean {
  return isHazloSanoOrigin(value);
}

/** Las procedencias que puede declarar quien publica, según su rol. */
export function originsForUser(isAdmin: boolean): readonly PostOrigin[] {
  return isAdmin ? POST_ORIGINS : POST_ORIGINS.filter(isCommunityOrigin);
}

function isCommunityOrigin(value: PostOrigin): boolean {
  return !isHazloSanoOrigin(value);
}

/**
 * Normaliza el `origin` recibido de un request según el rol del autor. Es la defensa en servidor:
 * - vacío/nulo → `null` (sin especificar)
 * - valor inválido (fuera de la allowlist) → `null`
 * - valor `hazlo_sano_*` pedido por un no-admin → `null` (se ignora)
 * - en cualquier otro caso → el valor válido tal cual
 *
 * Un producto que se queda en `null` lo rechaza `PostValidator`: descartar la procedencia forjada
 * no puede terminar en una publicación sin procedencia.
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
