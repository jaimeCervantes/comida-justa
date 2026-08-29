import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, addComment } = vi.hoisted(() => ({
  auth: vi.fn(),
  addComment: vi.fn(),
}));

/* `getTranslations` es de servidor y jsdom entra por la rama de cliente. Se sustituye por el
   catálogo real de `comments`, para que borrar una clave rompa la prueba —el mismo criterio que
   `renderWithIntl` y que `editar/[slug]/actions.test.ts`—. */
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("~/i18n/messages/es.json")).default;

  return {
    getTranslations: async (namespace: "comments") =>
      createTranslator({ locale: "es", messages, namespace }),
  };
});
vi.mock("~/infra/auth", () => ({ auth }));
vi.mock("~/infra/dataAccess/comments/PostgresCommentRepository", () => ({
  PostgresCommentRepository: vi.fn(() => ({
    addComment,
    getComments: vi.fn(),
  })),
}));

import { addCommentToPost } from "./actions";

/**
 * Quién firma un comentario.
 *
 * `addCommentToPost` es una Server Action, o sea **un endpoint HTTP público**. Recibía al autor como
 * tercer parámetro —desde el navegador— y lo escribía tal cual en `comments.user_id`: bastaba el id
 * de otra persona real para firmar un comentario a su nombre, y después del hecho no hay forma de
 * distinguir el falso del verdadero. En un sitio donde la confianza entre vecinos *es* el producto,
 * eso no se deshace con un `git revert`.
 *
 * Estas pruebas afirman lo único que cierra el agujero: **el autor sale de la sesión del servidor**.
 * Por eso miran lo que llega al repositorio y no lo que se pinta: el repositorio es el último punto
 * donde la identidad todavía se puede falsificar.
 */
describe("addCommentToPost — quién firma", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addComment.mockResolvedValue({
      successMessage: "ok",
      comment: { id: "c1" },
    });
  });

  const ana = {
    id: "ana-id",
    name: "Ana",
    email: "ana@example.com",
    image: null,
  };

  it("firma con quien dice la sesión", async () => {
    auth.mockResolvedValue({ user: ana });

    await addCommentToPost("post-1", "Se ve buenísimo");

    expect(addComment).toHaveBeenCalledWith(
      "post-1",
      "Se ve buenísimo",
      expect.objectContaining({ id: "ana-id" }),
    );
  });

  /*
   * La prueba del agujero. No hay forma de escribirla como «se manda otro autor y se ignora»,
   * porque el arreglo es justamente que ese parámetro **ya no existe**: la firma de la acción es
   * la defensa. Si alguien lo devuelve, este `length` cambia y la prueba lo dice.
   */
  it("no acepta ningún autor por parámetro: la firma es la defensa", () => {
    expect(addCommentToPost.length).toBe(2);
  });

  it("sin sesión no escribe nada", async () => {
    auth.mockResolvedValue(null);

    const result = await addCommentToPost("post-1", "Se ve buenísimo");

    expect(addComment).not.toHaveBeenCalled();
    expect(result).toHaveProperty("errorMessage");
  });

  /* Una sesión sin `id` es tan poco autor como no tener sesión, y llegar así es posible: el proveedor
     puede devolver un usuario sin id antes de que la cuenta termine de crearse. */
  it("una sesión sin id tampoco firma", async () => {
    auth.mockResolvedValue({ user: { name: "Ana" } });

    const result = await addCommentToPost("post-1", "Se ve buenísimo");

    expect(addComment).not.toHaveBeenCalled();
    expect(result).toHaveProperty("errorMessage");
  });
});

/**
 * El contenido.
 *
 * Los dos escenarios —vacío y tope de 500— estaban escritos en
 * `src/e2e/createComments/createDirectCommentTopost.feature` desde el primer día y sólo se cumplían
 * en el navegador. El navegador no es la defensa de un endpoint público: `content` es una columna
 * `text`, así que sin tope en el servidor no hay tope.
 */
describe("addCommentToPost — qué se acepta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "ana-id", name: "Ana" } });
    addComment.mockResolvedValue({
      successMessage: "ok",
      comment: { id: "c1" },
    });
  });

  it.each([
    ["vacío", ""],
    ["de sólo espacios", "   \n  "],
  ])("rechaza un comentario %s", async (_caso, content) => {
    const result = await addCommentToPost("post-1", content);

    expect(addComment).not.toHaveBeenCalled();
    expect(result).toHaveProperty("errorMessage");
  });

  it("rechaza uno de 501 caracteres", async () => {
    const result = await addCommentToPost("post-1", "a".repeat(501));

    expect(addComment).not.toHaveBeenCalled();
    expect(result).toHaveProperty("errorMessage");
  });

  /* El tope es el último que entra, no el primero que sobra. */
  it("acepta uno de 500 caracteres exactos", async () => {
    await addCommentToPost("post-1", "a".repeat(500));

    expect(addComment).toHaveBeenCalled();
  });

  /* Lo que se cuenta y lo que se guarda son el mismo texto: si los espacios de los bordes contaran
     para el tope pero no se guardaran, el mensaje de error hablaría de un comentario que nadie
     escribió. */
  it("guarda el texto sin los espacios de los bordes", async () => {
    await addCommentToPost("post-1", "  Se ve buenísimo  ");

    expect(addComment).toHaveBeenCalledWith(
      "post-1",
      "Se ve buenísimo",
      expect.anything(),
    );
  });

  it("cuenta el largo sobre el texto recortado, no sobre los espacios", async () => {
    await addCommentToPost("post-1", `  ${"a".repeat(500)}  `);

    expect(addComment).toHaveBeenCalled();
  });
});
