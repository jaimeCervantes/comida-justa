import { describe, expect, it } from "vitest";
import {
  firstValidityProblem,
  type ValidityProblem,
  validationMessageFor,
} from "./validity";

/** Un `ValidityState` de mentira: todo en falso salvo lo que la prueba enciende. */
function validity(...flags: ValidityProblem[]): ValidityState {
  const state = {
    valueMissing: false,
    typeMismatch: false,
    patternMismatch: false,
    tooLong: false,
    tooShort: false,
    rangeUnderflow: false,
    rangeOverflow: false,
    stepMismatch: false,
    badInput: false,
    customError: false,
    valid: flags.length === 0,
  };

  for (const flag of flags) state[flag] = true;

  return state as ValidityState;
}

describe("firstValidityProblem", () => {
  it("no ve problema donde el navegador no lo ve", () => {
    expect(firstValidityProblem(validity())).toBeNull();
  });

  it.each([
    "valueMissing",
    "badInput",
    "typeMismatch",
    "patternMismatch",
    "rangeUnderflow",
    "rangeOverflow",
    "stepMismatch",
    "tooShort",
    "tooLong",
  ] as const)("reconoce %s cuando viene solo", (problem) => {
    expect(firstValidityProblem(validity(problem))).toBe(problem);
  });

  /**
   * El navegador enciende varias banderas a la vez y sólo se puede decir una frase. El orden no es
   * de gustos: "falta" gana a "mal formado" porque un campo vacío no tiene formato del que hablar.
   */
  it("un campo vacío se explica por vacío, no por su formato", () => {
    expect(
      firstValidityProblem(validity("valueMissing", "patternMismatch")),
    ).toBe("valueMissing");
  });

  /**
   * `durationMinutes` lleva `min="5" step="5"`. Un 3 queda por debajo del mínimo **y** fuera del
   * paso, porque el paso se cuenta desde el mínimo. Decir "escribe múltiplos de 5" a quien escribió
   * 3 es contestar la pregunta que no hizo.
   */
  it("un 3 con min=5 y step=5 se explica por el mínimo, no por el paso", () => {
    expect(
      firstValidityProblem(validity("rangeUnderflow", "stepMismatch")),
    ).toBe("rangeUnderflow");
  });
});

describe("validationMessageFor", () => {
  it("devuelve la frase de la bandera encendida", () => {
    expect(
      validationMessageFor(validity("valueMissing"), {
        valueMissing: "El título es obligatorio.",
      }),
    ).toBe("El título es obligatorio.");
  });

  it("no dice nada cuando el campo es válido", () => {
    expect(
      validationMessageFor(validity(), { valueMissing: "Falta." }),
    ).toBeNull();
  });

  /**
   * Sin frase no se inventa una: el design system no lee el catálogo, así que un mapa incompleto
   * significa que nadie tradujo ese caso todavía. Mejor callar que hablar en el idioma equivocado
   * —la misma decisión que `genericErrorLabel` en `TextArea`.
   */
  it("calla cuando el mapa no trae frase para esa bandera", () => {
    expect(
      validationMessageFor(validity("stepMismatch"), {
        valueMissing: "Falta.",
      }),
    ).toBeNull();
  });
});
