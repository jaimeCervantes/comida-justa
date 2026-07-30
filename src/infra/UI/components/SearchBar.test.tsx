import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import SearchBar from "./SearchBar";

const DEBOUNCE_MS = 500;

function givenResults(titles: string[]) {
  return vi.fn().mockResolvedValue({
    json: async () => ({
      results: titles.map((title, i) => ({
        id: `post-${i}`,
        translations: { es: { title, slug: title.toLowerCase().replace(/\s/g, "-") } },
      })),
    }),
  });
}

const dropdown = () => screen.queryByText("Ver todos los resultados");
const skeleton = () => document.querySelector(".animate-pulse");

/**
 * El componente no tenía pruebas, y `showDropdown`/`loading` se calculaban con `setState` dentro de
 * un efecto (renders en cascada). Ahora se derivan de la consulta y del resultado; estos casos fijan
 * el comportamiento que ese cálculo debe conservar.
 */
describe("SearchBar", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    push.mockReset();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // Regla: no se busca con menos de 3 caracteres, salvo que se cierre una palabra con espacio.
  describe.each([
    ["pa", false, "shorter than the minimum"],
    ["   ", false, "only whitespace"],
    ["pan", true, "reaches the minimum length"],
    ["pa ", true, "a space closes the word"],
  ])("typing %j", (text, shouldOpen, reason) => {
    it(`${shouldOpen ? "opens" : "keeps closed"} the dropdown — ${reason}`, async () => {
      vi.stubGlobal("fetch", givenResults(["Pan de masa madre"]));
      render(<SearchBar />);

      await user.type(screen.getByRole("searchbox"), text);
      vi.advanceTimersByTime(DEBOUNCE_MS);

      if (shouldOpen) {
        await waitFor(() => expect(dropdown()).toBeInTheDocument());
      } else {
        expect(dropdown()).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
      }
    });
  });

  it("shows the skeleton while the request is in flight, before any result", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);

    await waitFor(() => expect(skeleton()).toBeInTheDocument());
  });

  it("lists the results once they arrive", async () => {
    vi.stubGlobal("fetch", givenResults(["Pan de masa madre", "Jugo Verde"]));
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);

    await waitFor(() => expect(screen.getByText("Pan de masa madre")).toBeInTheDocument());
    expect(screen.getByText("Jugo Verde")).toBeInTheDocument();
    expect(skeleton()).not.toBeInTheDocument();
  });

  it("says so when the search matched nothing", async () => {
    vi.stubGlobal("fetch", givenResults([]));
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);

    await waitFor(() => expect(screen.getByText("Sin resultados")).toBeInTheDocument());
  });

  // Un fallo esconde el desplegable entero: no se anuncia "sin resultados" por una búsqueda que
  // nunca llegó a ejecutarse.
  it("hides the dropdown when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() => expect(dropdown()).not.toBeInTheDocument());
    expect(screen.queryByText("Sin resultados")).not.toBeInTheDocument();
  });

  it("debounces, so typing a word fires a single request", async () => {
    const fetchMock = givenResults(["Pan de masa madre"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "panad");
    vi.advanceTimersByTime(DEBOUNCE_MS);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toContain("q=panad");
  });

  it("searches immediately when a space closes the word, with no debounce", async () => {
    const fetchMock = givenResults(["Pan de masa madre"]);
    vi.stubGlobal("fetch", fetchMock);
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan ");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("dismisses on a click outside, and comes back when typing resumes", async () => {
    vi.stubGlobal("fetch", givenResults(["Pan de masa madre"]));
    render(<SearchBar />);

    const input = screen.getByRole("searchbox");
    await user.type(input, "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await waitFor(() => expect(dropdown()).toBeInTheDocument());

    await user.click(document.body);
    await waitFor(() => expect(dropdown()).not.toBeInTheDocument());

    await user.type(input, "e");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await waitFor(() => expect(dropdown()).toBeInTheDocument());
  });

  it("navigates to the full results page and closes the dropdown", async () => {
    vi.stubGlobal("fetch", givenResults(["Pan de masa madre"]));
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await waitFor(() => expect(dropdown()).toBeInTheDocument());

    await user.click(screen.getByText("Ver todos los resultados"));

    expect(push).toHaveBeenCalledWith("/search?q=pan");
    await waitFor(() => expect(dropdown()).not.toBeInTheDocument());
  });

  it("navigates to a result when it is picked", async () => {
    vi.stubGlobal("fetch", givenResults(["Pan de masa madre"]));
    render(<SearchBar />);

    await user.type(screen.getByRole("searchbox"), "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await waitFor(() => expect(screen.getByText("Pan de masa madre")).toBeInTheDocument());

    await user.click(screen.getByText("Pan de masa madre"));

    expect(push).toHaveBeenCalledWith("/pan-de-masa-madre");
  });

  it("closes the dropdown when the query is cleared", async () => {
    vi.stubGlobal("fetch", givenResults(["Pan de masa madre"]));
    render(<SearchBar />);

    const input = screen.getByRole("searchbox");
    await user.type(input, "pan");
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await waitFor(() => expect(dropdown()).toBeInTheDocument());

    await user.clear(input);

    await waitFor(() => expect(dropdown()).not.toBeInTheDocument());
  });
});
