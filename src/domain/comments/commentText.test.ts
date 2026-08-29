import { describe, expect, it } from "vitest";
import { normalizeCommentText } from "./commentText";

/**
 * La forma en que un comentario se guarda.
 *
 * Cada caso de aquí es un rodeo concreto, no una precaución en abstracto: o hace que lo mostrado
 * diga algo distinto de lo guardado, o esconde una palabra del filtro que viene después, o convierte
 * un comentario en media pantalla en blanco.
 *
 * Los caracteres van escritos con `\u`. Pegados literalmente son invisibles: la prueba pasaría o
 * fallaría por algo que nadie puede leer en el diff.
 */
describe("normalizeCommentText", () => {
  it("quita la anulación de derecha a izquierda, que hace leer lo contrario", () => {
    /* `U+202E` da la vuelta a lo que sigue: la ficha enseña el texto invertido mientras la base
       guarda otro. Es el truco de «Trojan Source», aplicado a lo que lee un vecino. */
    expect(normalizeCommentText("Es \u202Eseguro")).toBe("Es seguro");
  });

  it("quita los invisibles que parten una palabra", () => {
    // Se lee «estafa» y no casa con ninguna búsqueda de «estafa» — ni con ningún filtro.
    expect(normalizeCommentText("e\u200Bs\u200Bt\u200Ba\u200Bfa")).toBe(
      "estafa",
    );
  });

  it("deja intacto el emoji de familia, que se une con un invisible", () => {
    /* `U+200D` es de la misma categoría que los de arriba y NO se quita: es lo que hace de tres
       personas una familia. Quitarlo sería un daño visible y seguro a cambio de casi nada. */
    const familia = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}";

    expect(normalizeCommentText(`Qué rica receta ${familia}`)).toBe(
      `Qué rica receta ${familia}`,
    );
  });

  it("quita los controles que no dicen nada", () => {
    expect(normalizeCommentText("hola\u0000\u0007 mundo")).toBe("hola mundo");
  });

  it("respeta el salto de línea, que es como se separan dos ideas", () => {
    expect(normalizeCommentText("Primera\nSegunda")).toBe("Primera\nSegunda");
  });

  it("corta la avalancha de saltos en un párrafo en blanco", () => {
    /* La ficha pinta el comentario con `whitespace-pre-wrap`, así que 500 saltos son 500 renglones
       que empujan la publicación entera fuera de la pantalla. */
    expect(normalizeCommentText(`Arriba${"\n".repeat(40)}Abajo`)).toBe(
      "Arriba\n\nAbajo",
    );
  });

  it("unifica los finales de línea de Windows", () => {
    expect(normalizeCommentText("Primera\r\nSegunda\rTercera")).toBe(
      "Primera\nSegunda\nTercera",
    );
  });

  it("normaliza a NFC: el mismo café escrito de dos maneras es el mismo texto", () => {
    const compuesto = "caf\u00E9";
    const descompuesto = "cafe\u0301";

    expect(normalizeCommentText(descompuesto)).toBe(compuesto);
    expect(normalizeCommentText(compuesto)).toBe(compuesto);
  });

  it("recorta al final, cuando quitar invisibles ya dejó los bordes en blanco", () => {
    /* El orden es la regla: si el recorte fuera antes, esto se guardaría con un espacio de sobra a
       cada lado y el tope contaría caracteres que nadie escribió. */
    expect(normalizeCommentText("\u200B  hola  \u200B")).toBe("hola");
  });

  it("deja en nada un comentario que solo traía invisibles", () => {
    // Lo que hace que la comprobación de «vacío» de la acción signifique algo.
    expect(normalizeCommentText("\u200B\u202E\u00AD  ")).toBe("");
  });

  it("no toca un comentario normal", () => {
    const normal = "Se ve buenísimo, ¿lo llevas a la feria del sábado? 🥜";

    expect(normalizeCommentText(normal)).toBe(normal);
  });
});
