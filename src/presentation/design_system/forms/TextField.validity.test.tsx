import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { TextField } from "./TextField";

const PHONE_MESSAGES = {
  valueMissing: "El teléfono es obligatorio.",
  patternMismatch: "Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116",
} as const;

afterEach(cleanup);

function renderPhone(props: Partial<Parameters<typeof TextField>[0]> = {}) {
  return render(
    <TextField
      label="Teléfono"
      name="phone"
      type="tel"
      required
      pattern="^\+?(\d{1,3})?[0-9]{10}$"
      validationMessages={PHONE_MESSAGES}
      {...props}
    />,
  );
}

function phone(): HTMLInputElement {
  return screen.getByRole("textbox", { name: /teléfono/i }) as HTMLInputElement;
}

describe("TextField — cuándo se pinta el error", () => {
  /** Un campo vacío recién abierto no está mal: está sin llenar. */
  it("no acusa a nadie al abrirse", () => {
    renderPhone();

    expect(screen.queryByText(/obligatorio/i)).not.toBeInTheDocument();
    expect(phone()).not.toHaveAttribute("aria-invalid");
  });

  it("no pinta de rojo un teléfono a medio escribir", async () => {
    renderPhone();

    await userEvent.type(phone(), "278");

    expect(screen.queryByText(/10 dígitos/i)).not.toBeInTheDocument();
  });

  it("habla al salir del campo", async () => {
    renderPhone();

    await userEvent.type(phone(), "278109211");
    await userEvent.tab();

    expect(
      screen.getByText(
        "Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116",
      ),
    ).toBeInTheDocument();
    expect(phone()).toHaveAttribute("aria-invalid", "true");
  });

  /** Ya tocado, se revalida en cada tecla: el error se va en la misma que lo arregla. */
  it("borra el mensaje en cuanto se corrige, sin esperar al envío", async () => {
    renderPhone();

    await userEvent.type(phone(), "278109211");
    await userEvent.tab();
    await userEvent.click(phone());
    await userEvent.type(phone(), "6");

    expect(screen.queryByText(/10 dígitos/i)).not.toBeInTheDocument();
    expect(phone()).not.toHaveAttribute("aria-invalid");
  });

  it("explica el vacío por vacío y no por su formato", async () => {
    renderPhone();

    await userEvent.click(phone());
    await userEvent.tab();

    expect(screen.getByText("El teléfono es obligatorio.")).toBeInTheDocument();
  });
});

describe("TextField — el hueco lo comparten el navegador y el servidor", () => {
  it("muestra el error que contestó la Server Action", () => {
    renderPhone({ error: "El teléfono es obligatorio." });

    expect(screen.getByText("El teléfono es obligatorio.")).toBeInTheDocument();
    expect(phone()).toHaveAttribute("aria-invalid", "true");
  });

  /**
   * El error del servidor es una foto del envío anterior. En cuanto se toca el campo deja de
   * describir lo que hay en pantalla, y dejarlo puesto haría que corregir no se notara.
   */
  it("retira el error del servidor en cuanto se edita el campo", async () => {
    renderPhone({ error: "El teléfono es obligatorio." });

    await userEvent.type(phone(), "2781092116");

    expect(
      screen.queryByText("El teléfono es obligatorio."),
    ).not.toBeInTheDocument();
  });

  /** Un solo mensaje por campo: dos formas de verse mal es ninguna. */
  it("no apila el del navegador sobre el del servidor", async () => {
    renderPhone({ error: "El teléfono es obligatorio." });

    await userEvent.type(phone(), "278109211");
    await userEvent.tab();

    expect(screen.getAllByRole("paragraph")).toHaveLength(1);
    expect(
      screen.getByText(
        "Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116",
      ),
    ).toBeInTheDocument();
  });

  it("deja el mensaje atado al campo para quien no lo ve", async () => {
    renderPhone();

    await userEvent.type(phone(), "278109211");
    await userEvent.tab();

    const describedBy = phone().getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      /10 dígitos/,
    );
  });
});
