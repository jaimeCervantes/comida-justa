import { describe, expect, it } from "vitest";
import { MARK_IN_MS, MARK_LAG_MS, WORD_IN_MS } from "../kineticTiming";
import { captionAt, type FrameWord } from "./captionFrame";

const words = (markup: string, elapsedMs: number) =>
  captionAt(markup, elapsedMs).flatMap((segment) =>
    segment.parts.filter((part): part is FrameWord => part !== " "),
  );

describe("El subtítulo del video, cuadro a cuadro", () => {
  const markup = "Hay <hl>cuatro pilares</hl> para volver.";

  it("al empezar no se ve ninguna palabra", () => {
    expect(words(markup, 0).every((word) => word.progress === 0)).toBe(true);
  });

  it("las palabras entran una tras otra", () => {
    const [first, second] = words(markup, WORD_IN_MS / 2);
    expect(first.progress).toBeGreaterThan(second.progress);
  });

  it("pasado un par de segundos, todas están en su sitio y el subrayado completo", () => {
    const frame = captionAt(markup, 3000);
    expect(
      frame
        .flatMap((segment) => segment.parts)
        .every((part) => part === " " || part.progress === 1),
    ).toBe(true);
    expect(frame.find((segment) => segment.highlight)?.markProgress).toBe(1);
  });

  it("el subrayado solo avanza en la frase clave, y después de sus palabras", () => {
    const before = captionAt(markup, MARK_LAG_MS);
    expect(before.find((segment) => segment.highlight)?.markProgress).toBe(0);
    expect(before.find((segment) => !segment.highlight)?.markProgress).toBe(0);

    const halfway = captionAt(markup, 55 + MARK_LAG_MS + MARK_IN_MS / 2);
    expect(
      halfway.find((segment) => segment.highlight)?.markProgress,
    ).toBeCloseTo(0.5);
  });

  it("el texto es el mismo que se lee, con sus espacios", () => {
    const text = captionAt(markup, 0)
      .flatMap((segment) => segment.parts)
      .map((part) => (part === " " ? " " : part.text))
      .join("");
    expect(text).toBe("Hay cuatro pilares para volver.");
  });
});
