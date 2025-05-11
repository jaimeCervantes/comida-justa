import { cleanup, render } from "@testing-library/react";
import { expect, vi, describe, afterEach, it } from "vitest";
import userEvent from "@testing-library/user-event";
import TextField from "./TextField";

import { HiMail } from "react-icons/hi";

describe("When TextField is rendered", () => {
  afterEach(() => {
    cleanup();
  });

  it("Then it should render correctly", () => {
    const view = render(<TextField name="email" label="Nombre" type="email" />);
    const input: HTMLElement = view.getByRole("textbox", { name: "Nombre" });
    expect(input).toBeInTheDocument();
  });

  it("Then it should render correctly with label", () => {
    const view = render(<TextField name="email" type="email" label="Nombre" />);
    const input = view.getByRole("textbox", { name: "Nombre" });

    expect(input).toBeInTheDocument();
  });

  it("Then it should render correctly with input type number and label", () => {
    const view = render(
      <TextField name="precio" type="number" label="Precio:" />
    );
    const input = view.getByRole("spinbutton", { name: /precio/i });

    expect(input).toBeInTheDocument();
  });

  it("Then it should not allow submit with an empty required field", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const view = render(
      <form onSubmit={spy}>
        <TextField label="Nombre" name="nombre" type="text" required />
        <button type="submit">Send</button>
      </form>
    );

    const btn = view.getByRole("button");
    await user.click(btn);

    expect(spy).not.toHaveBeenCalled();
  });

  it("Then typing should called onChange function", async () => {
    const spy = vi.fn();
    const view = render(
      <TextField
        label="Nombre"
        name="nombre"
        type="text"
        required
        onChange={spy}
      />
    );

    const field = view.getByLabelText("Nombre");
    await userEvent.type(field, "Jaime");

    expect(spy).toHaveBeenCalled();
  });

  it("Then it should submit with a required value", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const view = render(
      <form onSubmit={spy}>
        <TextField
          label="Nombre"
          name="nombre"
          type="text"
          required
          onChange={spy}
        />
        <button type="submit">Send</button>
      </form>
    );

    const field = view.getByLabelText("Nombre");
    await user.type(field, "Jaime");

    expect(spy).toHaveBeenCalled();
  });

  it("Then an icon should be existed", () => {
    const view = render(
      <TextField
        label="Correo"
        name="mail"
        type="email"
        icon={<HiMail data-testid="icon-mail" />}
        required
      />
    );

    const icon = view.getByTestId("icon-mail");
    expect(icon).toBeInTheDocument();
  });

  it("Then, if an error exist, a error message should be shown", () => {
    const view = render(
      <TextField
        label="Correo"
        name="mail"
        type="email"
        error="Not fund mail"
        required
      />
    );

    const errorMessage = view.getByText("Not fund mail");
    expect(errorMessage).toBeInTheDocument();
  });

  it("Then it should not allow submit when value doesn't match pattern attribute", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const view = render(
      <form onSubmit={spy}>
        <TextField
          label="Nombre"
          name="nombre"
          type="text"
          required
          pattern="[a-zA-Z]{3,50}"
          onChange={spy}
        />
        <button type="submit">Send</button>
      </form>
    );

    const btn = view.getByRole("button");
    await user.click(btn);

    expect(spy).not.toHaveBeenCalled();
  });

  it("Then it should  submit when value match pattern attribute", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const view = render(
      <form onSubmit={spy}>
        <TextField
          label="Nombre"
          name="nombre"
          type="text"
          required
          pattern="[a-zA-Z]{3,50}"
          onChange={spy}
        />
        <button type="submit">Send</button>
      </form>
    );

    const field = view.getByLabelText("Nombre");
    await user.type(field, "Jaime");

    expect(spy).toHaveBeenCalled();
  });
});
