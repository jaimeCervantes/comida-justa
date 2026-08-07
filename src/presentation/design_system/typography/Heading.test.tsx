import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading } from "./Heading";

/**
 * Cubre el escenario "La tipografía deja de ser text-sm a mano" (`@slice-6`) de
 * `src/e2e/design-system/design-system.feature`.
 */
describe("Heading", () => {
  it.each([1, 2, 3, 4] as const)("el nivel %s produce su etiqueta", (level) => {
    render(<Heading level={level}>Título</Heading>);

    expect(screen.getByRole("heading", { level })).toBeInTheDocument();
  });

  it.each([
    [1, "text-heading-lg"],
    [2, "text-heading-md"],
    [3, "text-heading-sm"],
    [4, "text-body-lg"],
  ] as const)("el nivel %s toma su tamaño por defecto", (level, expected) => {
    render(<Heading level={level}>Título</Heading>);

    expect(screen.getByRole("heading", { level })).toHaveClass(expected);
  });

  /**
   * La razón de ser de este componente: sin separar nivel de tamaño, quien necesita un encabezado
   * pequeño dentro de una tarjeta acaba poniendo un `<h4>` donde el documento pedía un `<h2>`, o
   * peor, un `<h2>` donde pedía un `<h4>` porque tenía que verse grande.
   */
  it("permite un nivel alto con apariencia pequeña sin mentir sobre la estructura", () => {
    render(
      <Heading level={2} size="xs">
        Sección discreta
      </Heading>,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveClass("text-body-lg");
    expect(heading).not.toHaveClass("text-heading-md");
  });

  it("deja el color a quien llama cuando el tono es inherit", () => {
    render(
      <Heading level={1} tone="inherit" className="text-pillar-sleep-ink">
        Sueño
      </Heading>,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-pillar-sleep-ink");
    expect(heading).not.toHaveClass("text-text-base");
  });

  it("no usa variantes dark: — el tono sale del token", () => {
    render(<Heading level={1}>Título</Heading>);

    expect(screen.getByRole("heading", { level: 1 }).className).not.toContain(
      "dark:",
    );
  });
});
