import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  /**
   * No hay nada que anunciar mientras carga: el contenido todavía no existe. Un lector de pantalla
   * leyendo «imagen, imagen, imagen» sobre huecos vacíos es peor que el silencio. Quien avisa de la
   * carga es el contenedor, con `aria-busy`.
   */
  it("es invisible para un lector de pantalla", () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveAttribute("role", "presentation");
  });

  /**
   * El brillo que recorre el bloque es justo el tipo de animación que provoca mareo, así que va
   * bajo `motion-safe` y desaparece para quien pidió menos movimiento en su sistema.
   */
  it("no anima si el sistema pide menos movimiento", () => {
    const { container } = render(<Skeleton />);
    const className = container.firstElementChild?.className ?? "";

    const animationClasses = className
      .split(/\s+/)
      .filter((c) => c.includes("animate-") || c.includes("before:"));

    expect(animationClasses.length).toBeGreaterThan(0);
    for (const cssClass of animationClasses) {
      expect(cssClass).toContain("motion-safe:");
    }
  });

  it.each([
    ["chip", "rounded-chip"],
    ["control", "rounded-control"],
    ["card", "rounded-card"],
    ["pill", "rounded-full"],
  ] as const)("el radio %s aplica %s", (radius, expected) => {
    const { container } = render(<Skeleton radius={radius} />);

    expect(container.firstElementChild).toHaveClass(expected);
  });

  it("toma el fondo del token, sin variante dark:", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveClass("bg-surface-elevation-2");
  });

  it("acepta el tamaño que le da quien lo usa", () => {
    const { container } = render(<Skeleton className="h-64 w-full" />);

    expect(container.firstElementChild).toHaveClass("h-64", "w-full");
  });
});
