import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, type BadgeTone } from "./Badge";

/**
 * Cubre el `Scenario Outline` "Cada insignia del sitio es el mismo primitivo con otro tono" y el
 * escenario "Una insignia sin nada que decir no deja un hueco" de
 * `src/e2e/design-system/design-system.feature`.
 *
 * Va en Vitest y no en Playwright porque es presentación pura: no hay recorrido de navegación ni
 * dato de base que justifique levantar un navegador.
 */
describe("Badge", () => {
  it("muestra el texto que recibe", () => {
    render(<Badge>Agotado</Badge>);

    expect(screen.getByText("Agotado")).toBeInTheDocument();
  });

  describe.each<[unknown, string]>([
    [null, "no hay nada que decir"],
    [undefined, "no llega children"],
    ["", "el texto viene vacío"],
  ])("con children %j", (children, reason) => {
    it(`no renderiza nada — ${reason}`, () => {
      const { container } = render(<Badge>{children as never}</Badge>);

      expect(container).toBeEmptyDOMElement();
    });
  });

  /* La forma es la misma para todos los tonos: eso es justo lo que este primitivo vino a garantizar
     y lo que antes se copiaba a mano en tres archivos. */
  const TONES: BadgeTone[] = [
    "neutral",
    "brand",
    "accent",
    "sleep",
    "nutrition",
    "movement",
    "mindSpirit",
  ];

  it.each(TONES)("el tono %s conserva la forma del chip", (tone) => {
    render(
      <Badge tone={tone} data-testid="badge">
        Etiqueta
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    for (const shapeClass of [
      "inline-flex",
      "items-center",
      "rounded-full",
      "px-3",
      "py-1",
      "text-sm",
    ]) {
      expect(badge).toHaveClass(shapeClass);
    }
  });

  it("cada tono de pilar toma su fondo y su tinta del token, no de una utilidad cruda", () => {
    render(
      <Badge tone="movement" data-testid="badge">
        Movimiento
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("bg-pillar-movement-soft");
    expect(badge).toHaveClass("text-pillar-movement-ink");
  });

  it("distingue el énfasis fuerte del normal", () => {
    const { rerender } = render(<Badge data-testid="badge">Local</Badge>);
    expect(screen.getByTestId("badge")).toHaveClass("font-medium");

    rerender(
      <Badge emphasis="strong" data-testid="badge">
        Local
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("font-semibold");
  });

  it("acepta clases extra sin perder las suyas", () => {
    render(
      <Badge className="mt-2" data-testid="badge">
        Jugos
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("mt-2");
    expect(badge).toHaveClass("rounded-full");
  });
});
