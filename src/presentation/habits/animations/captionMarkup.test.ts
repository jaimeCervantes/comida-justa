import { describe, expect, it } from "vitest";
import { captionPlainText, parseCaption } from "./captionMarkup";

describe("El marcado de los subtítulos", () => {
  it.each([
    {
      markup: "Hay <hl>cuatro pilares</hl> para volver a acomodarlo.",
      segments: [
        { text: "Hay ", highlight: false },
        { text: "cuatro pilares", highlight: true },
        { text: " para volver a acomodarlo.", highlight: false },
      ],
    },
    {
      markup: "<hl>Nunca vivimos solos.</hl> La comunidad nos sostenía.",
      segments: [
        { text: "Nunca vivimos solos.", highlight: true },
        { text: " La comunidad nos sostenía.", highlight: false },
      ],
    },
    {
      markup: "Sin marcas.",
      segments: [{ text: "Sin marcas.", highlight: false }],
    },
    {
      markup: "En <hl>1879</hl> y <hl>hoy</hl>.",
      segments: [
        { text: "En ", highlight: false },
        { text: "1879", highlight: true },
        { text: " y ", highlight: false },
        /* El punto final se queda con la frase clave: ver la regla de la puntuación, abajo. */
        { text: "hoy.", highlight: true },
      ],
    },
  ])("separa «$markup» en tramos", ({ markup, segments }) => {
    expect(parseCaption(markup)).toEqual(segments);
  });

  it("el texto plano es el que se lee, sin marcas", () => {
    expect(
      captionPlainText("Volver a <hl>dormir al ritmo de la luz</hl>."),
    ).toBe("Volver a dormir al ritmo de la luz.");
  });
});

describe("La puntuación que sigue a la frase clave", () => {
  it.each([
    {
      markup:
        "Durante años, <hl>la luz decidió cuándo dormíamos</hl>. El sol se iba.",
      highlighted: "la luz decidió cuándo dormíamos.",
      after: " El sol se iba.",
    },
    {
      markup: "Dos anclas. <hl>Cerrar la noche</hl>: una hora antes.",
      highlighted: "Cerrar la noche:",
      after: " una hora antes.",
    },
    {
      markup: "Hay <hl>cuatro pilares</hl> para volver a acomodarlo.",
      highlighted: "cuatro pilares",
      after: " para volver a acomodarlo.",
    },
  ])(
    "se queda con ella, para no empezar sola el renglón: «$highlighted»",
    ({ markup, highlighted, after }) => {
      const segments = parseCaption(markup);
      const index = segments.findIndex((segment) => segment.highlight);
      expect(segments[index].text).toBe(highlighted);
      expect(segments[index + 1].text).toBe(after);
      expect(captionPlainText(markup)).toBe(
        segments.map((segment) => segment.text).join(""),
      );
    },
  );
});
