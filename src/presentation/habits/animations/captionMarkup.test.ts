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
        { text: "hoy", highlight: true },
        { text: ".", highlight: false },
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
