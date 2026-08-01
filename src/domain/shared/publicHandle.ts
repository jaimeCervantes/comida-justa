import { slugify } from "./slugify";

export interface HandleRules {
  minLength: number;
  maxLength: number;
  /** Segmentos que la propia ruta necesita para sí misma (paginación, altas, …). */
  reserved: readonly string[];
}

/**
 * La regla común de los nombres que viven en una URL: la tienda (`/tienda/<handle>`) y la persona
 * (`/u/<username>`).
 *
 * Se comparte porque es la misma decisión tomada dos veces —qué caracteres sobreviven, qué tan
 * corto es demasiado corto, qué palabras no se pueden ceder— y separarlas significaría que un día
 * `/tienda/mi-negocio` y `/u/mi-negocio` acepten cosas distintas sin que nadie lo haya decidido.
 * Lo que cambia entre las dos es la lista de reservadas, y por eso viaja como parámetro.
 */
export function generateHandle(
  source: string | null | undefined,
  rules: HandleRules,
): string {
  // Se recorta ANTES de quitar el guion final, para que un nombre largo no termine en "-".
  return slugify(source).slice(0, rules.maxLength).replace(/-+$/, "");
}

export function isValidHandle(handle: string, rules: HandleRules): boolean {
  return (
    handle.length >= rules.minLength &&
    handle.length <= rules.maxLength &&
    !rules.reserved.includes(handle)
  );
}
