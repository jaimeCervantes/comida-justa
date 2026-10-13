import "@testing-library/jest-dom/vitest";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { OutreachProductOption } from "~/use_cases/outreach/ports/IOutreachProductCatalog";
import OutreachTextForm from "./OutreachTextForm";

const { saveSpy } = vi.hoisted(() => ({
  saveSpy: vi.fn(async () => ({ errors: {} })),
}));

vi.mock("../actions", () => ({ saveOutreachText: saveSpy }));

afterEach(() => {
  cleanup();
  saveSpy.mockClear();
});

const t = es.outreach;

const PANES: readonly OutreachProductOption[] = [
  { postId: "pan-natural", title: "Pan de Masa Madre Natural", price: 96 },
  {
    postId: "pan-arandanos",
    title: "Pan de masa madre de arándanos",
    price: 125,
  },
  { postId: "jugo-verde", title: "Jugo Verde", price: 40 },
];

function renderForm() {
  renderWithIntl(<OutreachTextForm label={t.newHeading} products={PANES} />);
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

async function search(term: string): Promise<void> {
  await userEvent.type(
    picker().getByRole("searchbox", { name: t.searchLabel }),
    term,
  );
}

describe("OutreachTextForm", () => {
  it("encuentra un pan sin teclear acentos y lo agrega con su título como etiqueta", async () => {
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

  // Un Enter en el buscador enviaría el formulario a medio llenar.
  it("Enter en el buscador no envía el formulario", async () => {
    renderForm();

    await search("jugo{Enter}");

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
