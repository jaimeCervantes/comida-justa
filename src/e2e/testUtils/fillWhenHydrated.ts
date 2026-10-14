import { expect, type Locator } from "@playwright/test";

/**
 * Escribe en un campo de texto **y comprueba que quedó exactamente eso**, esperando a que React esté
 * enganchado.
 *
 * Hermano de `selectWhenHydrated`, con la misma carrera de fondo pero otro síntoma, y peor. `fill`
 * selecciona todo y escribe encima; si cae justo mientras React hidrata el formulario, la selección
 * se pierde y lo nuevo se pega **delante** de lo que ya había. Visto el 2026-10-14 al corregir un pie
 * compartido: el campo quedó en «NUEVO…VIEJO…», se guardó así, y lo que falló tres pantallas
 * después fue la comparación del texto final. En un campo vacío no se nota —no hay nada detrás—,
 * por eso solo muerde al editar.
 *
 * `toPass` reintenta la pareja completa —escribir y comprobar que se quedó—, que es lo que convierte
 * la carrera en una espera. No se hace con un `waitForTimeout`: dormir medio segundo funciona hasta
 * el día que la máquina va lenta.
 */
export async function fillWhenHydrated(
  field: Locator,
  value: string,
): Promise<void> {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}
