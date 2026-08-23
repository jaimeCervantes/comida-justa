import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { publishKindTestId } from "./publishKinds";
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

/**
 * Elegir el tipo de publicación.
 *
 * Desde el 5.3 el tipo son **píldoras** y no un desplegable, así que `selectOptions` ya no vale.
 * Existe aquí, y no repetido en cada archivo de pruebas, porque la última vez que cambió esta forma
 * hubo que editar cinco sitios: dos ayudantes de Vitest, tres page objects de la e2e y un spec.
 *
 * Se pulsa la **etiqueta** y no el radio: el radio va con `sr-only` —sigue en el árbol y sigue
 * recibiendo el foco, pero no ocupa sitio—, y pulsar la etiqueta es exactamente lo que hace quien
 * usa la página.
 */
export async function chooseKind(kind: string): Promise<void> {
  await openStepOf("kind");
  await userEvent.click(screen.getByTestId(publishKindTestId(kind)));
}

/**
 * Dejar un campo con su valor, de una vez.
 *
 * `userEvent.type` teclea letra por letra, y cada letra vuelve a renderizar el asistente entero: el
 * contador del título lee `draft.title.length`, así que el estado sube en cada pulsación. Rellenar
 * tres campos costaba 94 renderizados y 1.8 s — cinco veces lo que cualquier otra prueba del
 * archivo—, y bajo la carga de la suite completa eso se pasaba del límite de 5 s.
 *
 * Se usa para **preparar** el formulario, no para probar cómo escribe alguien. Cuando lo que se
 * afirma es la escritura misma —que salga el mensaje al salir del campo, que el contador avance—
 * hay que teclear de verdad con `userEvent`, porque ahí la pulsación es la conducta bajo prueba.
 */
export function fillField(field: HTMLElement, value: string): void {
  fireEvent.change(field, { target: { value } });
}
