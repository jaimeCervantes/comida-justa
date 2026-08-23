import { expect, type Locator } from "@playwright/test";

/**
 * Elige una opción de un `<select>` **controlado**, esperando a que React esté enganchado.
 *
 * El problema es real y no del navegador de pruebas: un `<select value={...} onChange={...}>` llega
 * del servidor como HTML normal, y hasta que la hidratación no engancha su `onChange`, cambiarlo no
 * avisa a nadie. React se hidrata, se encuentra con que su estado sigue vacío, y **devuelve el
 * `select` a su valor inicial**. Playwright teclea más rápido que eso: la elección desaparecía sin
 * error ninguno y lo que fallaba, tres líneas después, era otra cosa.
 *
 * `toPass` reintenta la pareja completa —elegir y comprobar que se quedó—, que es lo que convierte
 * una carrera en una espera. No se hace con un `waitForTimeout`: dormir medio segundo funciona hasta
 * el día que la máquina va lenta, y entonces vuelve como intermitencia.
 *
 * Vale para cualquier selector controlado de la aplicación, así que vive en `testUtils` y no dentro
 * de un page object.
 */
export async function selectWhenHydrated(
  select: Locator,
  value: string,
): Promise<void> {
  await expect(async () => {
    await select.selectOption(value);
    await expect(select).toHaveValue(value);
  }).toPass({ timeout: 15_000 });
}
