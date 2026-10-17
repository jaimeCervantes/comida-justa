import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type {
  OutreachProductMatch,
  OutreachProductPage,
} from "~/use_cases/outreach/searchOutreachProductsUseCase";
import OutreachTextForm from "./OutreachTextForm";

const { saveSpy, searchSpy } = vi.hoisted(() => ({
  saveSpy: vi.fn(async () => ({ errors: {} })),
  searchSpy: vi.fn(),
}));

vi.mock("../actions", () => ({
  saveOutreachText: saveSpy,
  searchOutreachProducts: searchSpy,
}));

afterEach(() => {
  cleanup();
  saveSpy.mockClear();
  searchSpy.mockReset();
});

const t = es.outreach;

const PANES: readonly OutreachProductMatch[] = [
  {
    postId: "pan-natural",
    title: "Pan de Masa Madre Natural",
    price: 96,
    photoUrl: null,
  },
  {
    postId: "pan-arandanos",
    title: "Pan de masa madre de arándanos",
    price: 125,
    photoUrl: null,
  },
  { postId: "jugo-verde", title: "Jugo Verde", price: 40, photoUrl: null },
];

function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * La búsqueda del servidor, de mentira: todas las palabras en el título, de diez en diez. Lo que
 * se prueba aquí es el formulario; cómo busca el servidor lo prueban su caso de uso y el e2e.
 */
function searchOver(catalog: readonly OutreachProductMatch[]) {
  searchSpy.mockImplementation(
    async (term: string, page: number): Promise<OutreachProductPage> => {
      const words = plain(term).split(/\s+/).filter(Boolean);
      const found = catalog.filter((product) =>
        words.every((word) => plain(product.title).includes(word)),
      );

      return {
        matches: found.slice((page - 1) * 10, page * 10),
        total: found.length,
        page,
        pageSize: 10,
      };
    },
  );
}

const PIES = [{ id: "pie-hazlo-sano", name: "Hazlo Sano" }];

function renderForm(footers = PIES, catalog = PANES) {
  searchOver(catalog);
  renderWithIntl(<OutreachTextForm label={t.newHeading} footers={footers} />);
}

function picker() {
  return within(screen.getByTestId("outreach-product-picker"));
}

/** Lo que el formulario mandará: el JSON del campo oculto, que es lo que guarda el orden. */
function sentItems(): Array<{ postId: string; label: string; emoji: string }> {
  const form = screen.getByRole("form", { name: t.newHeading });
  const field = form.querySelector<HTMLInputElement>('input[name="items"]');

  return JSON.parse(field?.value ?? "[]");
}

/** Escribe y espera la respuesta: el buscador pregunta al servidor al dejar de teclear. */
async function search(term: string): Promise<void> {
  await userEvent.type(
    picker().getByRole("searchbox", { name: t.searchLabel }),
    term,
  );
  await waitFor(() =>
    expect(picker().getByTestId("outreach-product-status")).toHaveTextContent(
      /resultado|Ningún/,
    ),
  );
}

describe("OutreachTextForm", () => {
  it("agrega lo que encuentra el buscador, con su título como etiqueta", async () => {
    renderForm();

    await search("arandanos");
    await userEvent.click(picker().getByRole("button", { name: t.addProduct }));

    expect(sentItems()).toEqual([
      {
        postId: "pan-arandanos",
        label: "Pan de masa madre de arándanos",
        emoji: "",
      },
    ]);
    expect(picker().getByText(t.alreadyAdded)).toBeInTheDocument();
  });

  it("guarda la etiqueta corta y el emoji que se escriben", async () => {
    renderForm();
    await search("natural");
    await userEvent.click(picker().getByRole("button", { name: t.addProduct }));

    const row = within(screen.getByTestId("outreach-item"));
    const label = row.getByRole("textbox", { name: new RegExp(t.itemLabel) });
    await userEvent.clear(label);
    await userEvent.type(label, "Natural");
    await userEvent.type(row.getByRole("textbox", { name: t.itemEmoji }), "🌾");

    expect(sentItems()).toEqual([
      { postId: "pan-natural", label: "Natural", emoji: "🌾" },
    ]);
  });

  it("el orden de la lista es el orden en que quedan, y se puede cambiar", async () => {
    renderForm();
    await search("masa madre");
    for (const button of picker().getAllByRole("button", {
      name: t.addProduct,
    })) {
      await userEvent.click(button);
    }

    expect(sentItems().map((item) => item.postId)).toEqual([
      "pan-natural",
      "pan-arandanos",
    ]);

    await userEvent.click(
      screen.getByRole("button", {
        name: `Subir Pan de masa madre de arándanos`,
      }),
    );

    expect(sentItems().map((item) => item.postId)).toEqual([
      "pan-arandanos",
      "pan-natural",
    ]);

    await userEvent.click(
      screen.getByRole("button", { name: "Quitar Pan de Masa Madre Natural" }),
    );

    expect(sentItems().map((item) => item.postId)).toEqual(["pan-arandanos"]);
  });

  it("no envía con el nombre vacío", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: t.save }));

    expect(saveSpy).not.toHaveBeenCalled();
    expect(
      await screen.findByText(es.validation.valueMissing),
    ).toBeInTheDocument();
  });

  // Escenario «Cambiar de página no envía el formulario ni pierde lo escrito», slice 8.
  it("cambiar de página no envía el formulario ni pierde lo escrito", async () => {
    const muchos = Array.from({ length: 25 }, (_, index) => ({
      postId: `masa-${index + 1}`,
      title: `Pan de masa madre ${index + 1}`,
      price: 125,
      photoUrl: null,
    }));
    renderForm(PIES, muchos);
    const name = screen.getByRole("textbox", {
      name: new RegExp(`^${t.nameLabel}`),
    });
    await userEvent.type(name, "Masa madre");
    await search("masa madre");

    await userEvent.click(picker().getByRole("button", { name: "2" }));

    expect(
      await picker().findByText("Pan de masa madre 11"),
    ).toBeInTheDocument();
    expect(picker().queryByText("Pan de masa madre 1")).not.toBeInTheDocument();
    expect(searchSpy).toHaveBeenLastCalledWith("masa madre", 2);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(name).toHaveValue("Masa madre");
  });

  // Un Enter en el buscador enviaría el formulario a medio llenar.
  it("Enter en el buscador no envía el formulario", async () => {
    renderForm();

    await search("jugo{Enter}");

    expect(saveSpy).not.toHaveBeenCalled();
  });

  describe("el pie y las versiones", () => {
    function footerSelect() {
      return screen.getByRole("combobox", {
        name: new RegExp(t.footerLabel),
      });
    }

    // Es el caso de casi siempre: un solo pie, el de la tienda.
    it("un texto nuevo arranca con el pie si solo hay uno", () => {
      renderForm();

      expect(footerSelect()).toHaveValue("pie-hazlo-sano");
    });

    it("con varios pies no elige ninguno por su cuenta", () => {
      renderForm([...PIES, { id: "pie-mm", name: "MM Naturalmente" }]);

      expect(footerSelect()).toHaveValue("");
    });

    it("quitar una versión no deja su texto pegado en la que sigue", async () => {
      renderForm();
      const versions = within(screen.getByTestId("outreach-versions"));

      await userEvent.click(
        versions.getByRole("button", { name: t.addVersion }),
      );
      await userEvent.click(
        versions.getByRole("button", { name: t.addVersion }),
      );
      await userEvent.type(
        versions.getByRole("textbox", { name: /Versión 2/ }),
        "Hecha aquí",
      );
      await userEvent.type(
        versions.getByRole("textbox", { name: /Versión 3/ }),
        "Sin levadura industrial",
      );

      await userEvent.click(
        versions.getByRole("button", { name: "Quitar la versión 2" }),
      );

      expect(versions.getAllByRole("textbox")).toHaveLength(1);
      expect(versions.getByRole("textbox", { name: /Versión 2/ })).toHaveValue(
        "Sin levadura industrial",
      );
    });
  });
});
