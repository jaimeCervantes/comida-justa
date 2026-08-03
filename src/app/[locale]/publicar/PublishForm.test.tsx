import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PublishForm from "./PublishForm";

const noop = vi.fn();

function renderForm(props: { hasStore?: boolean } = {}) {
  return renderWithIntl(
    <PublishForm
      action={noop}
      categoryOptions={[]}
      subCategoryOptionsByCategory={{}}
      {...props}
    />,
  );
}

async function selectProduct(): Promise<void> {
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: /tipo de publicación/i }),
    "producto",
  );
}

/**
 * El aviso existe para un caso y no para tres: declararse productor sin tienda es lo único que no
 * significa nada todavía —sin ubicación no hay distancia que verificar y no se entra a productores
 * locales—. Revender no exige tienda para ser cierto, y a quien ya la tiene no hay que decirle nada.
 */
describe("PublishForm — el aviso de abrir tienda", () => {
  it("aparece al declararse productor sin tener tienda", async () => {
    renderForm({ hasStore: false });
    await selectProduct();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
      "productor",
    );

    expect(screen.getByTestId("producer-needs-store")).toHaveTextContent(
      /tienda con ubicación/i,
    );
  });

  it("no aparece al declarar una reventa", async () => {
    renderForm({ hasStore: false });
    await selectProduct();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
      "reventa_cercana",
    );

    expect(
      screen.queryByTestId("producer-needs-store"),
    ).not.toBeInTheDocument();
  });

  it("no aparece a quien ya tiene tienda", async () => {
    renderForm({ hasStore: true });
    await selectProduct();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
      "productor",
    );

    expect(
      screen.queryByTestId("producer-needs-store"),
    ).not.toBeInTheDocument();
  });

  /* Un anuncio ni siquiera pregunta procedencia, así que no hay nada que avisar. */
  it("no aparece en un anuncio", () => {
    renderForm({ hasStore: false });

    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("producer-needs-store"),
    ).not.toBeInTheDocument();
  });
});
