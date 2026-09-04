import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import BecomeSellerForm from "./BecomeSellerForm";

function renderForm(): void {
  const action = vi.fn(async () => ({}));

  renderWithIntl(<BecomeSellerForm action={action} defaultName="Jaime" />);
}

describe("BecomeSellerForm", () => {
  /**
   * Al lado del botón de abrir la tienda había un «Cancelar» que llevaba a `/`, y no cancelaba
   * nada: el alta es un formulario, no un asistente de varios pasos, así que no hay nada empezado
   * que deshacer. Era una salida de la cuenta disfrazada de acción secundaria, a un centímetro de
   * la única que esta pantalla quiere que se pulse.
   *
   * Se afirma que **no hay ningún enlace** en el formulario, y no que falte una etiqueta concreta:
   * lo que se promete es que nada de aquí dentro te saca del sitio, no que cierta palabra no
   * aparezca.
   */
  it("no ofrece ninguna salida fuera de la cuenta", () => {
    renderForm();

    const form = screen.getByRole("form", {
      name: es.account.becomeSellerFormLabel,
    });

    expect(within(form).queryByRole("link")).not.toBeInTheDocument();
  });

  it("tiene un solo botón, y es el de enviar", () => {
    renderForm();

    const form = screen.getByRole("form", {
      name: es.account.becomeSellerFormLabel,
    });
    const buttons = within(form).getAllByRole("button");

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("type", "submit");
    expect(buttons[0]).toHaveTextContent(es.account.becomeSellerSubmit);
  });

  /* Lo que sí tiene que seguir: la dirección se calcula con la misma función del dominio que corre
     en el servidor, así que lo que se lee es lo que va a quedar guardado. */
  it("adelanta la dirección que va a quedar mientras se escribe el nombre", () => {
    renderForm();

    expect(screen.getByTestId("handle-preview")).toHaveTextContent(
      "/tienda/jaime",
    );
  });
});
