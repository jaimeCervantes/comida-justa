import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import NewCategoryForm from "./NewCategoryForm";

const { createCategorySpy } = vi.hoisted(() => ({
  createCategorySpy: vi.fn(async () => ({ errors: {} })),
}));

vi.mock("../actions", () => ({
  createCategory: createCategorySpy,
}));

afterEach(() => {
  cleanup();
  createCategorySpy.mockClear();
});

const roots: readonly CategoryOption[] = [
  { value: "alimentacion", label: "Alimentación" },
];

describe("NewCategoryForm — validación visible", () => {
  it("bloquea el envío inválido con el mensaje del catálogo", async () => {
    renderWithIntl(<NewCategoryForm roots={roots} />);

    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(
      screen.getByRole("form", { name: "Agregar categoría" }),
    ).toHaveAttribute("novalidate");
    expect(await screen.findAllByText("Falta llenar este campo.")).toHaveLength(
      2,
    );
    expect(createCategorySpy).not.toHaveBeenCalled();
  });
});
