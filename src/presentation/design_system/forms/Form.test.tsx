import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Form } from "./Form";
import { TextField } from "./TextField";

const MESSAGES = {
  valueMissing: "Falta llenar este campo.",
  patternMismatch: "El formato no es válido.",
} as const;

afterEach(cleanup);

function renderForm(action = vi.fn()) {
  return {
    action,
    ...render(
      <Form action={action} messages={MESSAGES} aria-label="Publicar">
        <TextField label="Título" name="title" type="text" required />
        <TextField
          label="Teléfono"
          name="phone"
          type="tel"
          required
          pattern="^\+?(\d{1,3})?[0-9]{10}$"
        />
        <button type="submit">Publicar</button>
      </Form>,
    ),
  };
}

describe("Form — el globito apagado", () => {
  /**
   * `noValidate` apaga el globito del navegador, **no** la validación: `validity` se sigue
   * calculando y es de donde sale todo lo demás. Sin este atributo el navegador pintaría su propia
   * burbuja encima de nuestro mensaje, en su idioma.
   */
  it("apaga la validación nativa del navegador, no la del formulario", () => {
    renderForm();

    expect(screen.getByRole("form", { name: "Publicar" })).toHaveAttribute(
      "novalidate",
    );
  });

  it("no molesta al servidor cuando el navegador ya sabe que falta algo", async () => {
    const { action } = renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(action).not.toHaveBeenCalled();
  });

  /** Uno por envío era el defecto del globito: aquí salen todos de golpe. */
  it("enseña el mensaje de todos los campos a la vez, no de uno en uno", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(await screen.findAllByText("Falta llenar este campo.")).toHaveLength(
      2,
    );
  });

  it("deja el foco en el primer campo inválido", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(screen.getByRole("textbox", { name: /título/i })).toHaveFocus();
  });

  it("salta al campo inválido aunque los de arriba estén bien", async () => {
    renderForm();

    await userEvent.type(
      screen.getByRole("textbox", { name: /título/i }),
      "Jugo Verde",
    );
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(screen.getByRole("textbox", { name: /teléfono/i })).toHaveFocus();
  });

  it("deja pasar el envío cuando todo está en orden", async () => {
    const { action } = renderForm();

    await userEvent.type(
      screen.getByRole("textbox", { name: /título/i }),
      "Jugo Verde",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /teléfono/i }),
      "2781092116",
    );
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(action).toHaveBeenCalledOnce();
  });
});
