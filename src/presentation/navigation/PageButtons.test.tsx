import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PageButtons from "./PageButtons";

const LABELS = {
  navigation: "Páginas de resultados",
  previous: "Anterior",
  next: "Siguiente",
};

function renderButtons(page: number, totalPages: number) {
  const onSelect = vi.fn();
  render(
    <form onSubmit={(event) => event.preventDefault()}>
      <PageButtons
        page={page}
        totalPages={totalPages}
        onSelect={onSelect}
        labels={LABELS}
      />
    </form>,
  );

  return onSelect;
}

describe("PageButtons", () => {
  afterEach(cleanup);

  it("enseña los números de la ventana y marca la actual", () => {
    renderButtons(6, 8);

    const nav = screen.getByRole("navigation", { name: LABELS.navigation });
    expect(nav).toHaveTextContent("Anterior45678Siguiente");
    expect(screen.getByRole("button", { name: "6" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("con una sola página no pinta nada", () => {
    renderButtons(1, 1);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("son botones que no envían el formulario: avisan a qué página ir", async () => {
    const onSelect = renderButtons(1, 3);

    const two = screen.getByRole("button", { name: "2" });
    expect(two).toHaveAttribute("type", "button");
    await userEvent.click(two);
    await userEvent.click(screen.getByRole("button", { name: LABELS.next }));

    expect(onSelect.mock.calls).toEqual([[2], [2]]);
  });

  it("sin anterior en la primera ni siguiente en la última", () => {
    renderButtons(3, 3);

    expect(
      screen.queryByRole("button", { name: LABELS.next }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: LABELS.previous }),
    ).toBeInTheDocument();
  });
});
