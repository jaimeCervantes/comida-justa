import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { Comment } from "~/infra/types/Posts";

const { getMoreComments, addCommentToPost } = vi.hoisted(() => ({
  getMoreComments: vi.fn(),
  addCommentToPost: vi.fn(),
}));

/* Las acciones son de servidor: en jsdom no hay servidor al que llamar, y lo que estos casos
   afirman es qué se pinta según lo que contesten, no cómo viaja la respuesta. */
vi.mock("../data-access/actions", () => ({
  getMoreComments,
  addCommentToPost,
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

/** Quien escribe: sin sesión el formulario manda a identificarse en vez de publicar. */
const VECINA = {
  id: "u1",
  name: "Vecina",
  email: "v@e.test",
} as unknown as Parameters<typeof CommentList>[0]["user"];

function render(
  comments: Comment[],
  total: number,
  user: Parameters<typeof CommentList>[0]["user"] = undefined,
) {
  return renderWithIntl(
    <CommentList
      postId="post-1"
      user={user}
      initialComments={comments}
      initialTotal={total}
    />,
  );
}

async function escribirComentario(texto: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(es.comments.inputLabel), texto);
  await user.click(screen.getByRole("button", { name: es.comments.submit }));
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

describe("Al publicar un comentario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* Antes había que recargar para verlo: `AddCommentForm` avisaba con `onAdd`, pero `CommentList`
     nunca le pasaba el callback. */
  it("aparece en la lista sin recargar, y arriba, que es donde van los nuevos", async () => {
    addCommentToPost.mockResolvedValue({
      successMessage: "ok",
      comment: { ...comentario("nuevo"), content: "Recién escrito" },
    });
    render([comentario("1")], 1, VECINA);

    await escribirComentario("Recién escrito");

    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Recién escrito");
  });

  /* El total sube con él: sin eso, escribir un comentario haría que la lista alcanzara al total y
     «cargar más» desaparecería aunque quedaran páginas por traer. */
  it("el botón sigue ofreciéndose si aún quedaban páginas por traer", async () => {
    addCommentToPost.mockResolvedValue({
      successMessage: "ok",
      comment: comentario("nuevo"),
    });
    render([comentario("1"), comentario("2")], 3, VECINA);

    await escribirComentario("Uno más");

    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(3),
    );
    expect(loadMore()).toBeInTheDocument();
  });

  /* Se avisaba **antes** de mirar el resultado, así que un fallo de la base pintaba igual el
     comentario en la lista — y al recargar desaparecía sin explicación. */
  it("no se pinta nada si la base lo rechazó, y se dice por qué", async () => {
    addCommentToPost.mockResolvedValue({ errorMessage: "No se pudo guardar" });
    render([comentario("1")], 1, VECINA);

    await escribirComentario("Este falla");

    expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
