import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import type { OrdersParams } from "./ordersHref";

const replace = vi.fn();

/* Se mockea el wrapper y no `next/navigation`, por el mismo motivo que `SearchBar`: sustituir el
   módulo de Next entero deja a next-intl sin las piezas con las que construye su navegación. */
vi.mock("~/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import OrdersSearchField from "./OrdersSearchField";

const DEBOUNCE_MS = 300;

const enLoAbierto: OrdersParams = {
  view: "received",
  scope: "open",
  term: "",
  page: 1,
};

const field = () => screen.getByTestId("orders-search");

/**
 * Deja pasar el tiempo **dentro de `act`**: el disparo mete la navegación en una transición, y su
 * `isPending` es un cambio de estado que React exige ver envuelto o avisa por consola.
 */
const esperar = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/**
 * La corrida de escritorio de `orders.feature` (@slice-6): cuándo se consulta al servidor mientras
 * se escribe. Son cuestiones de tiempo, y montarlas en el navegador sería medir esperas reales en
 * cada corrida de la suite.
 */
describe("OrdersSearchField", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    replace.mockReset();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pide la lista una sola vez cuando se deja de escribir", async () => {
    render(<OrdersSearchField current={enLoAbierto} />);

    await user.type(field(), "sue");
    expect(replace).not.toHaveBeenCalled();

    await esperar(DEBOUNCE_MS);

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/pedidos", query: { vista: "received", q: "sue" } },
      { scroll: false },
    );
  });

  /* Sin espera no hay consulta: 300 ms es justo lo que separa "está tecleando" de "ya escribió". */
  it("no consulta mientras las teclas siguen cayendo", async () => {
    render(<OrdersSearchField current={enLoAbierto} />);

    await user.type(field(), "sue");
    await esperar(DEBOUNCE_MS - 50);

    expect(replace).not.toHaveBeenCalled();
  });

  /* Volver a la lista entera es un filtro más, no la ausencia de uno: si borrar no disparara, la
     lista se quedaría filtrada por un término que ya no está escrito en ninguna parte. */
  it("borrar del todo también pide la lista, ya sin término", async () => {
    render(<OrdersSearchField current={{ ...enLoAbierto, term: "sue" }} />);

    await user.clear(field());
    await esperar(DEBOUNCE_MS);

    expect(replace).toHaveBeenCalledWith(
      { pathname: "/pedidos", query: { vista: "received" } },
      { scroll: false },
    );
  });

  it("conserva la pestaña y el estado, y vuelve a la primera página", async () => {
    const enTerminadosPagina4: OrdersParams = {
      view: "placed",
      scope: "closed",
      term: "",
      page: 4,
    };

    render(<OrdersSearchField current={enTerminadosPagina4} />);

    await user.type(field(), "suero");
    await esperar(DEBOUNCE_MS);

    expect(replace).toHaveBeenCalledWith(
      {
        pathname: "/pedidos",
        query: { vista: "placed", estado: "closed", q: "suero" },
      },
      { scroll: false },
    );
  });

  /* El servidor recorta y normaliza al leer la URL. Si el campo no comparara ya normalizado, un
     espacio final dejaría los dos términos distintos para siempre y el efecto se repetiría solo. */
  it("un espacio de más no dispara una consulta que el servidor ya contestó", async () => {
    render(<OrdersSearchField current={{ ...enLoAbierto, term: "suero" }} />);

    await user.type(field(), " ");
    await esperar(DEBOUNCE_MS * 4);

    expect(replace).not.toHaveBeenCalled();
  });

  /* Sin JavaScript esto es lo único que queda, así que no puede desaparecer al añadir el disparo
     automático: el `<form method="get">` con su campo `q` y los demás filtros ocultos. */
  it("sigue siendo un formulario que se puede enviar con Enter", () => {
    render(<OrdersSearchField current={{ ...enLoAbierto, scope: "closed" }} />);

    const form = field().closest("form");

    expect(form).toHaveAttribute("method", "get");
    expect(field()).toHaveAttribute("name", "q");
    expect(form?.querySelector('input[name="estado"]')).toHaveValue("closed");
    expect(form?.querySelector('input[name="vista"]')).toHaveValue("received");
  });
});
