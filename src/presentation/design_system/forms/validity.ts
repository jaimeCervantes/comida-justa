/**
 * La lectura del veredicto del navegador.
 *
 * **El navegador juzga; nosotros hablamos.** Los atributos del campo (`required`, `pattern`, `min`,
 * `step`, `type`) siguen siendo la regla —declarativa, y en pie aunque no cargue el JavaScript—, y
 * `ValidityState` es lo que el navegador deduce de ellos. Lo único que este módulo añade es elegir
 * **una** bandera entre las que estén encendidas y buscarle frase.
 *
 * No hay React ni catálogo aquí a propósito: es TypeScript puro, así que se puede probar con una
 * tabla y sin montar nada.
 */

/** Las banderas de `ValidityState` que sabemos explicar. `customError` no entra: no la ponemos. */
export const VALIDITY_PROBLEMS = [
  "valueMissing",
  "badInput",
  "typeMismatch",
  "patternMismatch",
  "rangeUnderflow",
  "rangeOverflow",
  "stepMismatch",
  "tooShort",
  "tooLong",
] as const;

export type ValidityProblem = (typeof VALIDITY_PROBLEMS)[number];

/** Las frases de un campo, ya traducidas por quien llama. Incompleto es válido: se calla. */
export type ValidationMessages = Partial<Record<ValidityProblem, string>>;

/**
 * La primera bandera encendida, en orden de qué explica mejor lo que pasa.
 *
 * El navegador enciende varias a la vez y sólo cabe una frase, así que el orden de
 * `VALIDITY_PROBLEMS` **es** la decisión de producto:
 *
 * - `valueMissing` va primero porque un campo vacío no tiene formato del que hablar.
 * - `rangeUnderflow` va antes que `stepMismatch` porque el paso se cuenta desde el mínimo: un 3 en
 *   `min="5" step="5"` enciende las dos, y contestarle «escribe múltiplos de 5» a quien escribió 3
 *   responde la pregunta que no hizo.
 */
export function firstValidityProblem(
  validity: ValidityState,
): ValidityProblem | null {
  if (validity.valid) return null;

  return VALIDITY_PROBLEMS.find((problem) => validity[problem]) ?? null;
}

/**
 * La frase que le toca al estado del campo, o `null` si no hay ninguna que decir.
 *
 * Sin frase no se inventa una: el design system no lee el catálogo, así que un mapa sin esa clave
 * significa que nadie la ha traducido todavía. Callar es mejor que hablar en el idioma equivocado
 * —la misma decisión que `genericErrorLabel` en `TextArea`.
 */
export function validationMessageFor(
  validity: ValidityState,
  messages: ValidationMessages | undefined,
): string | null {
  const problem = firstValidityProblem(validity);

  if (!problem || !messages) return null;

  return messages[problem] ?? null;
}
