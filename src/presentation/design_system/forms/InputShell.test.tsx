import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InputShell } from "./InputShell";

/**
 * Cubre los escenarios de campo del `@slice-11` de `src/e2e/design-system/design-system.feature`.
 *
 * El componente no tenía prueba propia: se cubría de refilón desde `TextField.test.tsx`, que mira
 * el campo y no su carcasa. Las dos decisiones que este primitivo carga —qué borde delimita el
 * control y por qué no lleva el anillo de foco del sitio— son suyas, y aquí se defienden.
 */
describe("InputShell", () => {
  /**
   * El borde de un campo es lo único que dice dónde empieza el control, así que cae bajo
   * «Non-text Contrast» (WCAG 1.4.11) y necesita 3:1. `--border` no sirve: existe para separar
   * —decorativo, 1.27 sobre el papel— y por eso el slice 10 derivó `--border-field` aparte.
   *
   * Hasta ahora el campo pedía el decorativo. Este es el uso que hace que aquel token valga algo.
   */
  it("delimita su contorno con el borde de campo, no con el decorativo", () => {
    render(<InputShell data-testid="shell" />);

    const shell = screen.getByTestId("shell");
    expect(shell).toHaveClass("border-border-field");
    expect(shell.className).not.toMatch(/border-border(?!-field)/);
  });

  /**
   * Se probó con los dos —anillo fuera, borde dentro— y quedaban dos verdes concéntricos separados
   * por 2px alrededor de cada campo. El anillo se queda donde no hay otra señal: botones, avatar,
   * paginación, tarjetas.
   */
  it("no lleva el anillo de foco del sitio: su borde ya es la señal", () => {
    render(<InputShell data-testid="shell" />);

    const shell = screen.getByTestId("shell");
    expect(shell.className).not.toMatch(/focus-ring/);
    expect(shell.className).toMatch(/focus-within:border-/);
  });

  /**
   * El verde del foco se engorda con una sombra hacia dentro y no subiendo el `border` a 2px:
   * cambiar el ancho del borde mueve el contenido un píxel al enfocar, y con varios campos
   * seguidos eso se ve como un salto.
   */
  it("engorda el foco hacia dentro, para no mover el contenido", () => {
    render(<InputShell data-testid="shell" />);

    expect(screen.getByTestId("shell").className).toMatch(
      /focus-within:shadow-\[inset_/,
    );
  });

  it("redondea con el radio de control que estrenó el slice 10", () => {
    render(<InputShell data-testid="shell" />);

    const shell = screen.getByTestId("shell");
    expect(shell).toHaveClass("rounded-control");
    expect(shell.className).not.toMatch(/rounded-md/);
  });

  it.each([
    ["idle", "border-border-field"],
    ["error", "border-feedback-error"],
    ["disabled", "cursor-not-allowed"],
  ] as const)("el estado %s se distingue", (state, expected) => {
    render(<InputShell state={state} data-testid="shell" />);

    const shell = screen.getByTestId("shell");
    expect(shell).toHaveClass(expected);
    expect(shell).toHaveAttribute("data-state", state);
  });

  it("coloca el adorno final al otro extremo, sin tocar el contenido", () => {
    render(
      <InputShell trailingAdornment={<span>MXN</span>} data-testid="shell">
        <input readOnly value="180" />
      </InputShell>,
    );

    expect(screen.getByText("MXN").parentElement).toHaveClass("ml-auto");
    expect(screen.getByDisplayValue("180")).toBeInTheDocument();
  });
});
