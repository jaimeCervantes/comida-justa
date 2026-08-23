import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  firstStepWithAnyField,
  indexOfStep,
  PUBLISH_STEPS,
  type PublishStepId,
  stepForField,
} from "./publishSteps";

/**
 * La invariante que sostiene el asistente: **ningún campo puede quedarse sin paso**.
 *
 * Un campo huérfano no se ve en ninguna pantalla del asistente, así que no se puede rellenar y el
 * formulario no se puede enviar — y nada avisaría. Por eso los nombres no se copian aquí: se leen
 * del componente, y si alguien añade un `name=` sin asignarle paso, esta prueba lo dice.
 */
const FORM = readFileSync("src/app/[locale]/publicar/PublishForm.tsx", "utf8");

/** El campo de media no declara un `name` propio: lo arma `PostMediaField`. */
const NOT_IN_THE_FORM_SOURCE = ["media", "route"];

function fieldNamesInForm(): string[] {
  const declared = [...FORM.matchAll(/name="([a-zA-Z]+)"/g)].map(([, n]) => n);

  return [...new Set([...declared, ...NOT_IN_THE_FORM_SOURCE])];
}

describe("los pasos de /publicar", () => {
  it("son tres, en orden y sin repetirse", () => {
    const ids = PUBLISH_STEPS.map((step) => step.id);

    expect(ids).toEqual(["essentials", "details", "contact"]);
    expect(ids.map(indexOfStep)).toEqual([0, 1, 2]);
  });

  it("ningún campo del formulario se queda sin paso", () => {
    const orphans = fieldNamesInForm().filter((name) => !stepForField(name));

    expect(
      orphans,
      `${orphans.join(", ")} no está en ningún paso: no se vería en ninguna ` +
        "pantalla del asistente y el formulario no se podría enviar",
    ).toEqual([]);
  });

  it("y ningún paso declara un campo que ya no existe", () => {
    const inForm = new Set(fieldNamesInForm());
    const ghosts = PUBLISH_STEPS.flatMap((step) => step.fields).filter(
      (name) => !inForm.has(name),
    );

    expect(ghosts, `${ghosts.join(", ")} ya no está en el formulario`).toEqual(
      [],
    );
  });

  it("ningún campo pertenece a dos pasos", () => {
    const all = PUBLISH_STEPS.flatMap((step) => step.fields);

    expect(new Set(all).size).toBe(all.length);
  });

  /*
   * Cuando el servidor rechaza varios campos a la vez, se salta al **más temprano**: un error de
   * arriba suele ser la causa de los de abajo, y llevar a alguien al último lo deja arreglando el
   * síntoma.
   */
  it.each<[string[], PublishStepId | null]>([
    [["title"], "essentials"],
    [["phone"], "contact"],
    [["content"], "contact"],
    [["phone", "title"], "essentials"],
    [["price", "phone"], "details"],
    [["inventado"], null],
    [[], null],
  ])("con %j lleva al paso %s", (names, esperado) => {
    expect(firstStepWithAnyField(names)).toBe(esperado);
  });
});
