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

  /**
   * Slice 11. `pillarPalette.contrast.test.ts` dejó escrito desde el slice 3 que Movimiento
   * (#3c7b0f) y Mente (#0369a1) contrastan 1.14 entre sí como tinta: quien no distingue el tono no
   * los separa. La prueba documentaba el límite; esto lo atiende en la interfaz.
   *
   * El número entra como `counter` y no como parte del `children` para que la forma del círculo la
   * decida el primitivo una sola vez, en vez de copiarse en cada llamada — que es exactamente el
   * problema que este componente vino a resolver con las tres insignias del slice 3.
   */
  describe("el número del pilar", () => {
    it.each([
      ["Sueño", 1],
      ["Alimentación", 2],
      ["Movimiento", 3],
      ["Mente", 4],
    ] as const)("viaja dentro de la insignia de %s", (label, counter) => {
      render(
        <Badge tone="nutrition" counter={counter} data-testid="badge">
          {label}
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveTextContent(String(counter));
      expect(badge).toHaveTextContent(label);
    });

    it("se pinta como un círculo sólido, aparte de la etiqueta", () => {
      render(
        <Badge tone="movement" counter={3} data-testid="badge">
          Movimiento
        </Badge>,
      );

      const counter = screen.getByText("3");
      expect(counter).toHaveClass("rounded-full");
      expect(counter.textContent).toBe("3");
    });

    /* Un círculo vacío delante de "Agotado" sería ruido: la insignia sin pilar no cambia. */
    it("no deja un círculo vacío cuando la insignia no es de un pilar", () => {
      render(<Badge data-testid="badge">Agotado</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge.querySelector("span")).toBeNull();
      expect(badge).toHaveTextContent("Agotado");
    });
  });

  it("el énfasis sólido rellena en vez de teñir", () => {
    render(
      <Badge tone="brand" emphasis="solid" data-testid="badge">
        Nuevo
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("bg-button-primary-bg");
    expect(badge).toHaveClass("text-button-primary-text");
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
