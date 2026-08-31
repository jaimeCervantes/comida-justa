import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, addComment, countRecentByUser } = vi.hoisted(() => ({
  auth: vi.fn(),
  addComment: vi.fn(),
  countRecentByUser: vi.fn(),
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
    countRecentByUser,
    getComments: vi.fn(),
  })),
}));

/* `after` solo existe dentro de una petición real; fuera de una ruta de Next.js lanza. Mismo mock
   que `editar/[slug]/actions.test.ts`: lo que se prueba aquí es qué se guardó y con qué firma, no
   la revisión en segundo plano —que tiene sus propias pruebas en `reviewCommentContentUseCase`—. */
vi.mock("next/server", () => ({ after: vi.fn() }));

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
    countRecentByUser.mockResolvedValue(0);
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
    countRecentByUser.mockResolvedValue(0);
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

  /*
   * La normalización vive en el dominio y tiene sus propias pruebas
   * (`src/domain/comments/commentText.test.ts`). Lo que se afirma aquí es distinto y es lo único que
   * esas no pueden decir: que la acción **la aplica**, y que lo que llega a la base es el texto ya
   * limpio. Una regla de dominio que nadie llama protege exactamente a nadie.
   */
  it("guarda el texto ya normalizado, no el que llegó", async () => {
    await addCommentToPost("post-1", "Es \u202Eseguro\u200B");

    expect(addComment).toHaveBeenCalledWith(
      "post-1",
      "Es seguro",
      expect.anything(),
    );
  });

  /* Un comentario hecho sólo de invisibles no es un comentario, y sin normalizar antes pasaba el
     `trim` de sobra: no eran espacios. */
  it("rechaza uno hecho sólo de caracteres invisibles", async () => {
    const result = await addCommentToPost("post-1", "\u200B\u202E\u00AD");

    expect(addComment).not.toHaveBeenCalled();
    expect(result).toHaveProperty("errorMessage");
  });

  /* El tope se mide sobre lo que se va a guardar. Con 501 invisibles delante, el texto real cabe
     de sobra y rechazarlo sería rechazar un comentario que nadie escribió largo. */
  it("no cuenta para el tope lo que va a quitar", async () => {
    await addCommentToPost("post-1", `${"\u200B".repeat(501)}Se ve buenísimo`);

    expect(addComment).toHaveBeenCalledWith(
      "post-1",
      "Se ve buenísimo",
      expect.anything(),
    );
  });
});

/**
 * Cuánto, no qué.
 *
 * En todo el repositorio no había un solo límite de frecuencia. Con una sesión válida y un bucle, la
 * ficha de cualquiera se llena de miles de comentarios en un minuto, y limpiarlo después es trabajo
 * manual sobre datos que ya vio todo el mundo. Es el único de estos arreglos que ataja un abuso a
 * escala; los otros tres dicen qué se acepta.
 */
describe("addCommentToPost — cuántos por minuto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "ana-id", name: "Ana" } });
    addComment.mockResolvedValue({
      successMessage: "ok",
      comment: { id: "c1" },
    });
  });

  it("deja pasar a quien va por debajo del tope", async () => {
    countRecentByUser.mockResolvedValue(4);

    await addCommentToPost("post-1", "Se ve buenísimo");

    expect(addComment).toHaveBeenCalled();
  });

  it("frena al llegar al tope, sin escribir", async () => {
    countRecentByUser.mockResolvedValue(5);

    const result = await addCommentToPost("post-1", "Se ve buenísimo");

    expect(addComment).not.toHaveBeenCalled();
    expect(result).toHaveProperty("errorMessage");
  });

  /* Se cuenta por persona y sobre el último minuto: si la ventana no se moviera, el tope sería
     total y no por minuto — alguien quedaría callado para siempre a los cinco comentarios. */
  it("cuenta los de esa persona en el último minuto", async () => {
    countRecentByUser.mockResolvedValue(0);
    const antes = Date.now();

    await addCommentToPost("post-1", "Se ve buenísimo");

    const [userId, since] = countRecentByUser.mock.calls[0];

    expect(userId).toBe("ana-id");
    expect(since.getTime()).toBeGreaterThanOrEqual(antes - 60_000);
    expect(since.getTime()).toBeLessThanOrEqual(Date.now() - 59_000);
  });

  /* Antes de contar nada: preguntarle a la base por alguien que no ha iniciado sesión es una
     consulta que ningún visitante debería poder provocar. */
  it("no consulta la frecuencia de quien no tiene sesión", async () => {
    auth.mockResolvedValue(null);

    await addCommentToPost("post-1", "Se ve buenísimo");

    expect(countRecentByUser).not.toHaveBeenCalled();
  });
});
