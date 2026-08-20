import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Surface } from "./Surface";

/**
 * Cubre el escenario "Las tarjetas dejan de decidir su propio radio" (`@slice-5`) de
 * `src/e2e/design-system/design-system.feature`.
 */
describe("Surface", () => {
  it("renderiza un div por defecto", () => {
    render(<Surface data-testid="surface">contenido</Surface>);

    expect(screen.getByTestId("surface").tagName).toBe("DIV");
  });

  it("adopta el elemento que se le pide, para no romper la semántica de la página", () => {
    render(
      <Surface as="article" data-testid="surface">
        una publicación
      </Surface>,
    );

    expect(screen.getByTestId("surface").tagName).toBe("ARTICLE");
  });

  it("no pinta nada por defecto salvo el radio: una superficie neutra es invisible", () => {
    render(<Surface data-testid="surface">x</Surface>);

    const surface = screen.getByTestId("surface");
    expect(surface).toHaveClass("rounded-lg");
    expect(surface.className).not.toMatch(/shadow|border|bg-/);
  });

  /**
   * Slice 11. `card` y `panel` son la escala de v2, que el slice 10 expuso con nombre propio; el
   * resto son la escala de Tailwind y siguen aquí porque hay superficies que aún las piden.
   *
   * El nombre dice **qué** se redondea y no cuánto mide: una tarjeta que pide `card` sigue siendo
   * correcta el día que la tarjeta cambie de radio, y ese día se toca `layout.css` una vez.
   */
  it.each([
    ["card", "rounded-card"],
    ["panel", "rounded-panel"],
  ] as const)("el radio con nombre %s aplica %s", (radius, expected) => {
    render(
      <Surface radius={radius} data-testid="surface">
        x
      </Surface>,
    );

    expect(screen.getByTestId("surface")).toHaveClass(expected);
  });

  it.each([
    ["md", "rounded-md"],
    ["lg", "rounded-lg"],
    ["xl", "rounded-xl"],
    ["2xl", "rounded-2xl"],
  ] as const)("el radio %s aplica %s", (radius, expected) => {
    render(
      <Surface radius={radius} data-testid="surface">
        x
      </Surface>,
    );

    expect(screen.getByTestId("surface")).toHaveClass(expected);
  });

  it("compone fondo, borde y elevación como una tarjeta real", () => {
    render(
      <Surface
        as="article"
        radius="2xl"
        background="raised"
        border="subtle"
        elevation="md"
        data-testid="surface"
      >
        x
      </Surface>,
    );

    const surface = screen.getByTestId("surface");
    expect(surface).toHaveClass("bg-surface-elevation-1");
    expect(surface).toHaveClass("border-separator");
    expect(surface).toHaveClass("shadow-md");
    expect(surface).toHaveClass("rounded-2xl");
  });

  /**
   * El color viene del token semántico, que ya cambia de valor con el tema. Una variante `dark:`
   * aquí significaría que alguien volvió a resolver el tema a mano, que es justo lo que se quitó.
   */
  it("no necesita variantes dark:", () => {
    render(
      <Surface background="raised" border="subtle" data-testid="surface">
        x
      </Surface>,
    );

    expect(screen.getByTestId("surface").className).not.toContain("dark:");
  });

  it("solo se eleva al pasar el cursor si es interactiva", () => {
    const { rerender } = render(<Surface data-testid="surface">x</Surface>);
    expect(screen.getByTestId("surface").className).not.toContain("hover:");

    rerender(
      <Surface interactive data-testid="surface">
        x
      </Surface>,
    );
    expect(screen.getByTestId("surface")).toHaveClass("hover:-translate-y-1");
  });

  it("acepta clases extra sin perder las suyas", () => {
    render(
      <Surface radius="2xl" className="p-4" data-testid="surface">
        x
      </Surface>,
    );

    const surface = screen.getByTestId("surface");
    expect(surface).toHaveClass("p-4");
    expect(surface).toHaveClass("rounded-2xl");
  });
});
