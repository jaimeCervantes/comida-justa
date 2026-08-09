import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PublishForm from "./PublishForm";

const noop = vi.fn();

const ALIMENTACION = { value: "alimentacion", label: "Alimentación" } as const;
const JUGOS = { value: "jugos", label: "Jugos" } as const;

function renderForm(
  props: {
    hasStore?: boolean;
    categoryOptions?: readonly { value: string; label: string }[];
    subCategoryOptionsByCategory?: Record<
      string,
      readonly { value: string; label: string }[]
    >;
  } = {},
) {
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

/**
 * La categoría se ofrecía solo en `producto`, por considerarla ruido en un anuncio. El efecto era
 * que todo anuncio se guardaba con `category` en null, y sin categoría no hay forma de saber a qué
 * pilar pertenece: ninguna pantalla de pilar podía mostrarlos.
 */
describe("PublishForm — la categoría", () => {
  it("se pregunta en un anuncio, que es el kind por defecto", () => {
    renderForm({ categoryOptions: [ALIMENTACION] });

    expect(
      screen.getByRole("combobox", { name: /categoría/i }),
    ).toBeInTheDocument();
  });

  it("se sigue preguntando en un producto", async () => {
    renderForm({ categoryOptions: [ALIMENTACION] });
    await selectProduct();

    expect(
      screen.getByRole("combobox", { name: /categoría/i }),
    ).toBeInTheDocument();
  });

  it("ofrece sub-categoría en un anuncio una vez elegida la categoría", async () => {
    // Sin categoría no hay sub-categoría que ofrecer: la base rechaza la huérfana.
    renderForm({
      categoryOptions: [ALIMENTACION],
      subCategoryOptionsByCategory: { alimentacion: [JUGOS] },
    });

    expect(
      screen.queryByRole("combobox", { name: /sub-?categoría/i }),
    ).not.toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /categoría/i }),
      "alimentacion",
    );

    expect(
      screen.getByRole("combobox", { name: /sub-?categoría/i }),
    ).toBeInTheDocument();
  });
});
