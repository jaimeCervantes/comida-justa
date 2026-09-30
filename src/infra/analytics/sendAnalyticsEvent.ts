type Gtag = (
  command: "event",
  name: string,
  params: Record<string, string | number>,
) => void;

/**
 * Envía un evento a Google Analytics 4, si está cargado.
 *
 * El layout solo carga GA en producción y con `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`. Fuera de ahí
 * `gtag` no existe y esto no hace nada: ni errores ni avisos en la consola de desarrollo, que es lo
 * que haría `sendGAEvent` de `@next/third-parties`. Se llama a `gtag` y no se empuja al `dataLayer`
 * a mano porque gtag.js solo reconoce objetos `arguments`, no arreglos.
 *
 * Los parámetros no llevan datos personales: dicen qué pasó y dónde, nunca quién.
 */
export function sendAnalyticsEvent(
  name: string,
  params: Record<string, string | number>,
): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}
