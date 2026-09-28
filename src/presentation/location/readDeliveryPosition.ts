/** Cuánto se espera a la posición cuando el permiso ya estaba concedido: debe sentirse instantáneo. */
const GRANTED_TIMEOUT_MS = 3_000;

/**
 * Cuánto se espera, en total, cuando el navegador tiene que preguntar: incluye lo que la persona
 * tarda en contestar el diálogo. `timeout` de `getCurrentPosition` no cuenta ese rato, así que sin
 * este tope un diálogo ignorado dejaría la compra colgada.
 */
const PROMPT_TIMEOUT_MS = 20_000;

/**
 * La posición del navegador para usarla como destino de un pedido, o `null`.
 *
 * **Sí pide permiso** si todavía no se ha dado: es el mismo clic de confirmar, y el diálogo del
 * navegador es la única pregunta — no hay un paso propio del sitio. Si ya se negó antes, no se
 * insiste (el navegador tampoco volvería a preguntar). Si tarda, se niega, o el navegador no sabe
 * contestar, devuelve `null` y el pedido sale igual, sin destino.
 */
export async function readDeliveryPosition(): Promise<{
  lat: number;
  lng: number;
} | null> {
  if (!navigator.geolocation) return null;

  const permission = await permissionState();

  if (permission === "denied") return null;

  const budget =
    permission === "granted" ? GRANTED_TIMEOUT_MS : PROMPT_TIMEOUT_MS;

  return new Promise((resolve) => {
    const giveUp = window.setTimeout(() => resolve(null), budget);
    const settle = (value: { lat: number; lng: number } | null): void => {
      window.clearTimeout(giveUp);
      resolve(value);
    };

    navigator.geolocation.getCurrentPosition(
      (position) =>
        settle({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => settle(null),
      /* Una posición de hace un par de minutos sirve igual como destino y contesta al instante. */
      { timeout: GRANTED_TIMEOUT_MS, maximumAge: 120_000 },
    );
  });
}

/** `unknown` cuando el navegador no expone la API de permisos: entonces se intenta igual. */
async function permissionState(): Promise<PermissionState | "unknown"> {
  try {
    return (await navigator.permissions.query({ name: "geolocation" })).state;
  } catch {
    return "unknown";
  }
}
