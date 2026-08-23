import type { Page } from "@playwright/test";
import { stepForField } from "~/app/[locale]/publicar/publishSteps";

/**
 * Lleva `/publicar` al paso que contiene un campo.
 *
 * Desde el 5.3 del canvas, publicar es un asistente de tres pasos: los campos de los pasos que no
 * se ven llevan `hidden` y no se pueden rellenar. Quien conduzca ese formulario —page object o
 * spec— tiene que pasar por aquí.
 *
 * **El reparto sale de `PUBLISH_STEPS`, el mismo que usa el componente.** Es lo que impide que esto
 * envejezca: si mañana el precio cambia de paso, los tres consumidores lo siguen sin editarse. Una
 * copia del mapa en cada page object habría sido la cuarta lista de rutas de este repo, y ya se
 * sabe cómo acaban.
 */
export async function openPublishStep(
  page: Page,
  field: string,
): Promise<void> {
  const step = stepForField(field);

  // i18n-ignore: lo lee quien escribe la prueba, no quien visita el sitio.
  if (!step) throw new Error(`"${field}" no está en ningún paso de /publicar`);

  await page.getByTestId(`publish-step-${step}`).click();
}
