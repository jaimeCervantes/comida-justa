import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import { ValidatedForm } from "./ValidatedForm";

afterEach(cleanup);

describe("ValidatedForm", () => {
  it("explains the required asterisk in Spanish", () => {
    renderWithIntl(
      <ValidatedForm aria-label="Formulario">
        <button type="submit">Guardar</button>
      </ValidatedForm>,
    );

    expect(
      screen.getByText("Los campos marcados con * son obligatorios."),
    ).toBeInTheDocument();
  });

  it("explains the required asterisk in English", () => {
    renderWithIntl(
      <ValidatedForm aria-label="Form">
        <button type="submit">Save</button>
      </ValidatedForm>,
      { locale: "en" },
    );

    expect(
      screen.getByText("Fields marked with * are required."),
    ).toBeInTheDocument();
  });
});
