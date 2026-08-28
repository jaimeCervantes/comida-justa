import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { Comment } from "~/infra/types/Posts";

const { getMoreComments } = vi.hoisted(() => ({ getMoreComments: vi.fn() }));

/* La acción es de servidor: en jsdom no hay servidor al que llamar, y lo que estos casos afirman
   es qué se pinta según lo que conteste, no cómo viaja la respuesta. */
vi.mock("../data-access/actions", () => ({
  getMoreComments,
  addCommentToPost: vi.fn(),
}));

import CommentList from "./CommentList";

function comentario(id: string): Comment {
  return {
    id,
    postId: "post-1",
    content: `Comentario ${id}`,
    createdAt: new Date("2026-08-27T12:00:00.000Z"),
    user: { id: "u1", name: "Vecina", email: "v@e.test", image: undefined },
  } as unknown as Comment;
}

function render(comments: Comment[], total: number) {
  return renderWithIntl(
    <CommentList
      postId="post-1"
      user={undefined}
      initialComments={comments}
      initialTotal={total}
    />,
  );
}

const loadMore = () => screen.queryByTestId("load-more-comments");

describe("El botón de cargar más comentarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* Lo que se reportó: el botón se ofrecía siempre, incluso en una publicación sin un solo
     comentario, y la única forma de saber que no había nada más era pulsarlo. */
  it("no aparece cuando la publicación no tiene ningún comentario", () => {
    render([], 0);

    expect(loadMore()).not.toBeInTheDocument();
    expect(screen.getByText(es.comments.empty)).toBeInTheDocument();
  });

  it("no aparece cuando ya están todos en pantalla", () => {
    render([comentario("1"), comentario("2")], 2);

    expect(loadMore()).not.toBeInTheDocument();
  });

  it("aparece solo cuando quedan comentarios por traer", () => {
    render([comentario("1"), comentario("2")], 7);

    expect(loadMore()).toBeInTheDocument();
  });

  it("desaparece en cuanto la última página completa la lista", async () => {
    getMoreComments.mockResolvedValue({
      comments: [comentario("3")],
      total: 3,
    });
    const user = userEvent.setup();
    render([comentario("1"), comentario("2")], 3);

    await user.click(screen.getByTestId("load-more-comments"));

    await waitFor(() => expect(loadMore()).not.toBeInTheDocument());
    expect(screen.getByText("Comentario 3")).toBeInTheDocument();
  });

  /* El total se refresca con cada página: si alguien borró comentarios entre los dos renders, esta
     es la ocasión de enterarse y dejar de ofrecer un botón que ya no lleva a ninguna parte. */
  it("se retira si el total bajó desde que se pintó la ficha", async () => {
    getMoreComments.mockResolvedValue({ comments: [], total: 2 });
    const user = userEvent.setup();
    render([comentario("1"), comentario("2")], 9);

    await user.click(screen.getByTestId("load-more-comments"));

    await waitFor(() => expect(loadMore()).not.toBeInTheDocument());
    expect(screen.getByText(es.comments.noMore)).toBeInTheDocument();
  });
});
