import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, type AlertTone } from "./Alert";

/**
 * Cubre el escenario "El foco se ve siempre" y la parte de retroalimentación del `@slice-7` de
 * `src/e2e/design-system/design-system.feature`.
 */
describe("Alert", () => {
  it("muestra la etiqueta del tono junto al mensaje", () => {
    render(<Alert label="Error">No se pudo publicar</Alert>);

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("No se pudo publicar")).toBeInTheDocument();
  });

  /**
   * La decisión de accesibilidad del componente: un error tiene que interrumpir a un lector de
   * pantalla, y una confirmación no. Si el `role` fuera un prop, tarde o temprano un error pasaría
   * desapercibido por haberse anunciado en `polite`.
   */
  it.each<[AlertTone, string]>([
    ["error", "alert"],
    ["warning", "status"],
    ["success", "status"],
    ["info", "status"],
  ])("el tono %s se anuncia como %s", (tone, expectedRole) => {
    render(
      <Alert tone={tone} label="Aviso">
        mensaje
      </Alert>,
    );

    expect(screen.getByRole(expectedRole)).toBeInTheDocument();
  });

  it("por defecto no interrumpe", () => {
    render(<Alert label="Aviso">mensaje</Alert>);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  /**
   * Quien no distingue rojo de verde tiene que poder leer el aviso igual. Por eso la etiqueta es
   * obligatoria y no decorativa: es el dato que sobrevive cuando el color no se percibe.
   */
  it("el mensaje sigue siendo legible sin percibir el color", () => {
    render(
      <Alert tone="error" label="Error">
        Falta el precio
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Error Falta el precio",
    );
  });

  /**
   * Slice 11. Antes cada tono se pintaba con una opacidad sobre el color de marca
   * (`bg-feedback-error/10` y `text-text-base`), que es una forma de no decidir: el fondo real
   * dependía de lo que hubiera debajo, y la tinta era la del cuerpo, no una elegida para ese fondo.
   *
   * Los pares `soft`/`ink` entraron medidos en el slice 10 —11.86, 11.35 y 12.35— y aquí se
   * consumen. Un aviso ya no depende de sobre qué se pinte.
   */
  it.each<[AlertTone, string, string]>([
    ["success", "bg-feedback-success-soft", "text-feedback-success-ink"],
    ["warning", "bg-feedback-warning-soft", "text-feedback-warning-ink"],
    ["error", "bg-feedback-error-soft", "text-feedback-error-ink"],
  ])(
    "el tono %s toma su fondo y su tinta del par medido",
    (tone, soft, ink) => {
      render(
        <Alert tone={tone} label="Aviso">
          mensaje
        </Alert>,
      );

      const alert = screen.getByRole(tone === "error" ? "alert" : "status");
      expect(alert).toHaveClass(soft);
      expect(alert).toHaveClass(ink);
    },
  );

  it("ya no pinta el fondo con una opacidad sobre el color de marca", () => {
    render(
      <Alert tone="error" label="Error">
        mensaje
      </Alert>,
    );

    expect(screen.getByRole("alert").className).not.toMatch(
      /bg-feedback-error\/\d+/,
    );
  });

  it("acepta clases extra sin perder las suyas", () => {
    render(
      <Alert label="Listo" className="mt-4">
        Guardado
      </Alert>,
    );

    const alert = screen.getByRole("status");
    expect(alert).toHaveClass("mt-4");
    expect(alert).toHaveClass("rounded-control");
  });
});
