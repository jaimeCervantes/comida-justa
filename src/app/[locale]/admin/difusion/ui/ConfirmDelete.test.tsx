import "@testing-library/jest-dom/vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import ConfirmDelete, { type DeleteState } from "./ConfirmDelete";

const t = es.outreach;
const QUESTION =
  "¿Borrar el grupo «Mamás de Orizaba»? Se borra también su historial de publicaciones. No se puede deshacer.";

/** La acción de servidor, de mentira: contesta `answer` en vez de borrar. */
function deleteSpy(answer: DeleteState = {}) {
  return vi.fn(
    async (_state: DeleteState, _data: FormData): Promise<DeleteState> =>
      answer,
  );
}

function renderDelete(action = deleteSpy()) {
  renderWithIntl(
    <ConfirmDelete
      action={action}
      id="grupo-1"
      triggerLabel={t.deleteGroup}
      question={QUESTION}
    />,
  );

  return action;
}

describe("ConfirmDelete", () => {
  afterEach(cleanup);

  // Escenario «Sin confirmar no se borra nada» de `difusionEnGrupos.feature`.
  it("sin confirmar no se borra nada", async () => {
    const action = renderDelete();

    await userEvent.click(screen.getByRole("button", { name: t.deleteGroup }));
    expect(screen.getByRole("alert")).toHaveTextContent(QUESTION);
    await userEvent.click(screen.getByRole("button", { name: t.cancelDelete }));

    expect(action).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: t.deleteGroup }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: t.confirmDelete }),
    ).not.toBeInTheDocument();
  });

  it("al confirmar manda a borrar ese registro", async () => {
    const action = renderDelete();

    await userEvent.click(screen.getByRole("button", { name: t.deleteGroup }));
    await userEvent.click(
      screen.getByRole("button", { name: t.confirmDelete }),
    );

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0]?.[1].get("id")).toBe("grupo-1");
  });

  // Lo borró otra persona mientras la pantalla estaba abierta: la acción no redirige, contesta.
  it("si no se pudo, dice por qué", async () => {
    renderDelete(deleteSpy({ error: t.groupNotFound }));

    await userEvent.click(screen.getByRole("button", { name: t.deleteGroup }));
    await userEvent.click(
      screen.getByRole("button", { name: t.confirmDelete }),
    );

    expect(await screen.findByText(t.groupNotFound)).toBeInTheDocument();
  });
});
