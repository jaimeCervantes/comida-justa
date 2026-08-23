import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stepForField } from "./publishSteps";

/**
 * Llevar el formulario al paso que contiene un campo, para poder tocarlo.
 *
 * Desde que `/publicar` es un asistente, los campos de los pasos que no se ven llevan `hidden`, y
 * eso los saca del árbol de accesibilidad: `getByRole` no los encuentra, y con razón — nadie puede
 * rellenar lo que no está en pantalla.
 *
 * **El paso sale de `stepForField`, el mismo mapa que usa el componente.** Es lo que hace que esto
 * no envejezca: si alguien mueve el teléfono al primer paso, las pruebas lo siguen sin editarse.
 * Una copia del reparto aquí sería la tercera lista de las que este repo ya aprendió a no tener.
 */
export async function openStepOf(fieldName: string): Promise<void> {
  const step = stepForField(fieldName);

  if (!step) {
    // i18n-ignore: lo lee quien escribe la prueba, no quien visita el sitio.
    throw new Error(`"${fieldName}" no está en ningún paso de /publicar`);
  }

  await userEvent.click(screen.getByTestId(`publish-step-${step}`));
}
