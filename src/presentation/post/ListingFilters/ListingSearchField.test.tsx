import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";

const replace = vi.fn();

/* Se mockea el wrapper y no `next/navigation`, igual que `OrdersSearchField.test.tsx`. */
vi.mock("~/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import ListingSearchField from "./ListingSearchField";

const DEBOUNCE_MS = 300;
const esperar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

function renderField() {
  return render(
    <ListingSearchField
      pathname="/u/[username]"
      params={{ username: "ana" }}
      term=""
      filters={{
        currentPillar: "nutrition",
        onlyAvailable: true,
        onSale: false,
      }}
      labels={{ placeholder: "Buscar", label: "Buscar en el perfil" }}
      testId="profile-search"
    />,
  );
}

/** Slice 5 de `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`. */
describe("El buscador de un listado público", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    replace.mockReset();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("busca en el mismo listado sin soltar los filtros", async () => {
    renderField();

    await user.type(screen.getByTestId("profile-search"), "miel");
    await esperar(DEBOUNCE_MS);

    expect(replace).toHaveBeenCalledWith(
      {
        pathname: "/u/[username]",
        params: { username: "ana" },
        query: { pillar: "nutrition", disponibles: "1", q: "miel" },
      },
      { scroll: false },
    );
  });

  /* Sin JavaScript, el envío lo hace el `<form method="get">`: los filtros tienen que ir en él. */
  it("y lleva los filtros encendidos ocultos en el formulario, y solo esos", () => {
    const { container } = renderField();

    const hidden = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
    ).map((input) => [input.name, input.value]);

    expect(hidden).toEqual([
      ["pillar", "nutrition"],
      ["disponibles", "1"],
    ]);
  });
});
