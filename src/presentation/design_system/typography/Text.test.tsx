import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renderiza un párrafo por defecto", () => {
    render(<Text data-testid="text">Contenido</Text>);

    expect(screen.getByTestId("text").tagName).toBe("P");
  });

  it("puede ser un span cuando va dentro de otra línea de texto", () => {
    render(
      <Text as="span" data-testid="text">
        40
      </Text>,
    );

    expect(screen.getByTestId("text").tagName).toBe("SPAN");
  });

  it.each([
    ["body", "text-body"],
    ["lead", "text-body-lg"],
    ["label", "text-label"],
    ["caption", "text-caption"],
    ["tiny", "text-tiny"],
  ] as const)("la variante %s aplica %s", (variant, expected) => {
    render(
      <Text variant={variant} data-testid="text">
        x
      </Text>,
    );

    expect(screen.getByTestId("text")).toHaveClass(expected);
  });

  it("un párrafo largo lleva interlineado holgado y una etiqueta no", () => {
    const { rerender } = render(<Text data-testid="text">x</Text>);
    expect(screen.getByTestId("text")).toHaveClass("leading-relaxed");

    rerender(
      <Text variant="label" data-testid="text">
        x
      </Text>,
    );
    expect(screen.getByTestId("text")).toHaveClass("leading-normal");
  });

  it("el tono de apoyo existe como variante y no como gris escrito a mano", () => {
    render(
      <Text tone="support" data-testid="text">
        x
      </Text>,
    );

    const text = screen.getByTestId("text");
    expect(text).toHaveClass("text-text-support");
    expect(text.className).not.toContain("dark:");
  });

  it("acepta clases extra sin perder las suyas", () => {
    render(
      <Text variant="caption" className="mt-2" data-testid="text">
        x
      </Text>,
    );

    const text = screen.getByTestId("text");
    expect(text).toHaveClass("mt-2");
    expect(text).toHaveClass("text-caption");
  });
});
