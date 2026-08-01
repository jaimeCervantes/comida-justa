import type IMapUrlResolver from "~/use_cases/addBranch/ports/IMapUrlResolver";

/** Un enlace corto se expande en uno o dos saltos; más que eso es una cadena que no nos interesa. */
const MAX_REDIRECTS = 3;

/** Dar de alta una sucursal no puede quedarse colgado porque Google tarde. */
const TIMEOUT_MS = 5_000;

/**
 * Sigue el redirect de un enlace corto de Google Maps para quedarse con el largo, que sí lleva
 * coordenadas.
 *
 * **Nunca lanza.** Si Google no contesta, devuelve el enlace tal como entró: el caso de uso ya
 * sabe qué decir cuando no hay coordenadas ("copia la dirección de la barra o usa tu ubicación"),
 * y eso es más útil que un error de red que el vendedor no puede accionar.
 *
 * Se leen los `Location` a mano (`redirect: "manual"`) en vez de dejar que `fetch` los siga: así
 * basta con la cabecera y no se descarga el HTML de Google Maps, que pesa y no aporta nada.
 */
export class GoogleMapsUrlResolver implements IMapUrlResolver {
  async expand(url: string): Promise<string> {
    let current = url;

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      const next = await this.followOnce(current);

      if (!next || next === current) return current;

      current = next;
    }

    return current;
  }

  private async followOnce(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const location = response.headers.get("location");

      if (!location) return null;

      // Un `Location` relativo se resuelve contra el enlace que lo devolvió.
      return new URL(location, url).toString();
    } catch (error) {
      console.warn(`[maps] no se pudo expandir ${url}`, error);

      return null;
    }
  }
}
