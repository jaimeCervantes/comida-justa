/**
 * La posición del navegador **solo si ya dio permiso**, y sin esperar más de lo que se le concede.
 *
 * Es para un clic que tiene otro propósito —confirmar un pedido— y no puede convertirse en una
 * pregunta: si el permiso todavía no se ha dado, `getCurrentPosition` abriría el diálogo del
 * navegador en medio de la compra. Por eso se consulta antes el estado del permiso y, si no es
 * `granted`, se devuelve `null` sin preguntar nada. Lo mismo si tarda, si falla, o si el navegador
 * no sabe contestar: quien llama sigue sin ubicación, que es lo que había antes.
 */
export async function readGrantedPosition(
  timeoutMs = 3000,
): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation || !navigator.permissions) return null;

  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    if (permission.state !== "granted") return null;
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      /* Una posición de hace un par de minutos sirve igual como destino y contesta al instante. */
      { timeout: timeoutMs, maximumAge: 120_000 },
    );
  });
}
