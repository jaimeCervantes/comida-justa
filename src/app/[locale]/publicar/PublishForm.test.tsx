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
  await selectKind("producto");
}

async function selectKind(kind: string): Promise<void> {
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: /tipo de publicación/i }),
    kind,
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

/**
 * La aritmética de la lista —acumular, deduplicar, quitar, mover, recortar— dejó de vivir aquí: es
 * de `PostMediaField`, que ahora pintan las dos pantallas, y allí están sus pruebas. Lo que queda por
 * comprobar en este formulario es que **lo lleva puesto**: sin el campo, publicar volvería a mandar
 * una publicación sin archivos y ninguna prueba del componente se enteraría.
 */
describe("PublishForm — el campo de archivos", () => {
  it("lleva el selector y el campo oculto que lee la Server Action", () => {
    renderForm();

    expect(
      screen.getByLabelText(/sube tus mejores imágenes o videos/i),
    ).toBeInTheDocument();
    expect(document.querySelector('form input[name="media"]')).not.toBeNull();
  });
});

describe("PublishForm — zona horaria del evento", () => {
  it("manda la zona del navegador junto a las fechas locales", async () => {
    renderForm();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /tipo de publicación/i }),
      "evento",
    );

    expect(
      document.querySelector('form input[name="timeZone"]'),
    ).not.toBeNull();
  });
});

describe("PublishForm — campos por tipo", () => {
  it("un anuncio no pide precio, procedencia, fecha ni duración", () => {
    renderForm();

    expect(screen.queryByLabelText(/^precio/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cuándo empieza/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cuánto dura/i)).not.toBeInTheDocument();
  });

  it("un producto exige precio y procedencia", async () => {
    renderForm();

    await selectProduct();

    expect(screen.getByLabelText(/^precio/i)).toBeRequired();
    expect(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
    ).toBeRequired();
    expect(screen.queryByLabelText(/cuánto dura/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cuándo empieza/i)).not.toBeInTheDocument();
  });

  it("un evento exige inicio, pero deja el precio opcional", async () => {
    renderForm();

    await selectKind("evento");

    expect(screen.getByLabelText(/cuándo empieza/i)).toBeRequired();
    expect(screen.getByLabelText(/cuándo termina/i)).not.toBeRequired();
    expect(screen.getByLabelText(/^precio/i)).not.toBeRequired();
    expect(screen.queryByLabelText(/cuánto dura/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
  });

  it("un servicio exige duración y precio, sin procedencia ni fechas", async () => {
    renderForm();

    await selectKind("servicio");

    expect(screen.getByLabelText(/cuánto dura/i)).toBeRequired();
    expect(screen.getByLabelText(/^precio/i)).toBeRequired();
    expect(screen.queryByLabelText(/cuándo empieza/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
  });
});
