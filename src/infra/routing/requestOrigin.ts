import { headers } from "next/headers";

/**
 * El origen (`https://hazlosano.com`, `http://localhost:3100`) de la petición que se está atendiendo,
 * o `null` si no se puede saber.
 *
 * Sale de la petición y no de una constante a propósito: lo que lo usa —calentar el carrusel de
 * ofertas— tiene que pegarle al **mismo** servidor que atendió. Con la constante del sitio, un e2e o
 * el servidor local calentarían producción.
 *
 * Detrás de un proxy (Vercel) el host real viene en `x-forwarded-*`.
 */
export async function requestOrigin(): Promise<string | null> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");

  if (!host) return null;

  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const protocol =
    list.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (local ? "http" : "https");

  return `${protocol}://${host}`;
}
