import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PostMediaField from "./PostMediaField";

/**
 * El hook de subida, falso.
 *
 * Se sustituye entero y no solo `fetch` porque lo que se prueba aquí es **la aritmética de la
 * lista** —acumular, deduplicar, quitar, mover, recortar—, y esa vive en este componente. Cloud
 * Storage y sus tres llamadas son cosa del hook, y meterlas en esta prueba solo añadiría formas de
 * que falle por algo que no está midiendo.
 *
 * Devuelve una URL distinta por archivo: dos subidas que compartieran `path` se fundirían en una al
 * deduplicar, que es justo el error que la prueba tiene que poder ver.
 */
let uploadedCount = 0;

vi.mock("~/infra/UI/hooks/useStorageUpload", async () => {
  const { useState } = await import("react");

  return {
    default: () => {
      const [media, setMedia] = useState<
        Array<{ url: string; type: string; path: string }>
      >([]);
      const [isCompleted, setIsCompleted] = useState(false);

      return {
        uploadFiles: async (files: File[]) => {
          const batch = files.map((file) => {
            uploadedCount += 1;

            return {
              url: `https://firebasestorage.googleapis.com/posts/${uploadedCount}-${file.name}`,
              type: file.type,
              path: `posts/${uploadedCount}-${file.name}`,
            };
          });

          setMedia(batch);
          setIsCompleted(true);

          return batch;
        },
        uploadFile: async () => [],
        progress: 100,
        isCompleted,
        isLoading: false,
        media,
        error: null,
      };
    },
  };
});

const STORED = "https://firebasestorage.googleapis.com/v0/b/hazlo-sano/o";

function imageFile(name: string): File {
  return new File(["contenido"], name, { type: "image/jpeg" });
}

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function hiddenMediaValue(): unknown {
  const input = document.querySelector(
    'input[name="media"]',
  ) as HTMLInputElement;

  return JSON.parse(input.value);
}

/** Los nombres de archivo que la bandeja está enseñando, en su orden. */
function trayFileNames(): string[] {
  return (hiddenMediaValue() as Array<{ url: string }>).map(
    (file) => file.url.split("/").pop() ?? "",
  );
}

beforeEach(() => {
  uploadedCount = 0;
});

/**
 * Elige archivos y espera a que la bandeja los tenga.
 *
 * La espera no es cosmética: subir es asíncrono —el efecto que reporta la tanda hacia arriba corre
 * después de que React confirme el estado del hook—, así que afirmar en seco pasaba en aislamiento y
 * fallaba en la corrida completa, cuando la máquina va cargada. `findAllBy*` reintenta hasta que el
 * DOM tiene lo que se espera, que es lo que describe de verdad este flujo.
 */
async function pickFiles(names: string[]): Promise<HTMLElement[]> {
  await userEvent.upload(
    fileInput(),
    names.map((name) => imageFile(name)),
  );

  return screen.findAllByTestId("post-media-tray-item");
}

/**
 * Cada subida pisaba la anterior, así que no había forma de juntar dos archivos ni queriendo. Lo que
 * sigue describe la lista: qué la hace crecer, qué la hace encoger, qué la reordena, y qué acaba
 * viajando en el campo oculto —que es lo único que la Server Action llega a ver—.
 */
describe("PostMediaField — la lista de archivos", () => {
  it("empieza vacía y sin bandeja que enseñar", () => {
    renderWithIntl(<PostMediaField />);

    expect(screen.queryByTestId("post-media-tray")).not.toBeInTheDocument();
    expect(hiddenMediaValue()).toEqual([]);
  });

  it("guarda los tres archivos elegidos de una vez, en su orden", async () => {
    renderWithIntl(<PostMediaField />);

    const items = await pickFiles([
      "frente.jpg",
      "etiqueta.jpg",
      "interior.jpg",
    ]);

    expect(items).toHaveLength(3);
    expect(
      items.map((item) => within(item).getByText(/^\d$/).textContent),
    ).toEqual(["1", "2", "3"]);
    expect(hiddenMediaValue()).toHaveLength(3);
  });

  it("suma la segunda tanda en vez de reemplazar la primera", async () => {
    renderWithIntl(<PostMediaField />);

    await pickFiles(["frente.jpg"]);
    await pickFiles(["etiqueta.jpg"]);

    expect(
      await screen.findByTestId("post-media-tray-counter"),
    ).toHaveTextContent("2 de 10");
    expect(screen.getAllByTestId("post-media-tray-item")).toHaveLength(2);
  });

  it("quitar el de en medio deja los otros dos y los renumera", async () => {
    renderWithIntl(<PostMediaField />);

    await pickFiles(["frente.jpg", "etiqueta.jpg", "interior.jpg"]);

    await userEvent.click(
      screen.getByRole("button", { name: /quitar el archivo 2/i }),
    );

    const names = trayFileNames();

    expect(names).toHaveLength(2);
    expect(names[0]).toMatch(/frente\.jpg$/);
    expect(names[1]).toMatch(/interior\.jpg$/);
    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      "2 de 10",
    );
  });

  it("el campo oculto lleva la lista entera, que es lo único que ve el servidor", async () => {
    renderWithIntl(<PostMediaField />);

    await pickFiles(["frente.jpg", "etiqueta.jpg"]);

    expect(hiddenMediaValue()).toEqual([
      expect.objectContaining({ url: expect.stringMatching(/frente\.jpg$/) }),
      expect.objectContaining({ url: expect.stringMatching(/etiqueta\.jpg$/) }),
    ]);
  });

  it("de doce elegidos entran los diez que caben", async () => {
    /* Elegir la galería entera del teléfono es el caso normal, no el raro. Recortar es mejor que
       rechazar la selección completa y dejar a la persona empezando de nuevo. */
    renderWithIntl(<PostMediaField />);

    const items = await pickFiles(
      Array.from({ length: 12 }, (_, index) => `foto-${index}.jpg`),
    );

    expect(items).toHaveLength(10);
    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      /Llegaste al máximo/,
    );
  });

  it("al llegar al tope el selector deja de aceptar", async () => {
    renderWithIntl(<PostMediaField />);

    await pickFiles(
      Array.from({ length: 10 }, (_, index) => `foto-${index}.jpg`),
    );

    expect(fileInput()).toBeDisabled();
  });

  it("cambia la invitación una vez hay algo elegido", async () => {
    renderWithIntl(<PostMediaField />);

    expect(
      screen.getByLabelText(/sube tus mejores imágenes o videos/i),
    ).toBeInTheDocument();

    await pickFiles(["frente.jpg"]);

    expect(
      screen.getByLabelText(/agrega otra imagen u otro video/i),
    ).toBeInTheDocument();
  });
});

/**
 * Lo que estrena la edición: la lista no empieza vacía.
 *
 * Es la única diferencia real entre las dos pantallas, y por eso el componente es uno solo. Los
 * archivos guardados no traen `path` —eso es de Cloud Storage y solo lo tiene lo recién subido—, así
 * que el deduplicado tiene que saber caer a la URL o dos de ellos se verían como «el mismo».
 */
describe("PostMediaField — lo que la publicación ya tiene", () => {
  const guardados = [
    { url: `${STORED}/frente.jpg`, type: "image" },
    { url: `${STORED}/etiqueta.jpg`, type: "image" },
  ];

  it("los enseña desde el primer render, sin subir nada", () => {
    renderWithIntl(<PostMediaField initialItems={guardados} />);

    expect(screen.getAllByTestId("post-media-tray-item")).toHaveLength(2);
    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      "2 de 10",
    );
  });

  it("el archivo que se sube se añade detrás de los guardados", async () => {
    renderWithIntl(<PostMediaField initialItems={guardados} />);

    await pickFiles(["interior.jpg"]);

    expect(trayFileNames()).toEqual([
      "frente.jpg",
      "etiqueta.jpg",
      expect.stringMatching(/interior\.jpg$/),
    ]);
  });

  it("dos guardados sin `path` no se funden en uno al deduplicar", async () => {
    renderWithIntl(<PostMediaField initialItems={guardados} />);

    await pickFiles(["interior.jpg"]);

    expect(screen.getAllByTestId("post-media-tray-item")).toHaveLength(3);
  });

  it("quitar el que ya estaba lo saca del campo oculto", async () => {
    renderWithIntl(<PostMediaField initialItems={guardados} />);

    await userEvent.click(
      screen.getByRole("button", { name: /quitar el archivo 1/i }),
    );

    expect(trayFileNames()).toEqual(["etiqueta.jpg"]);
  });
});

/**
 * El orden **es** el dato: el índice acaba en `post_media.sort_order` y el 0 es la portada que leen
 * la tarjeta del listado, el carrito y el bot. Reordenar es de la bandeja, no de la pantalla, así
 * que se comporta igual al publicar que al editar.
 */
describe("PostMediaField — mover un archivo de sitio", () => {
  const tres = [
    { url: `${STORED}/A.jpg`, type: "image" },
    { url: `${STORED}/B.jpg`, type: "image" },
    { url: `${STORED}/C.jpg`, type: "image" },
  ];

  async function move(position: number, direction: "antes" | "después") {
    await userEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`archivo ${position} ${direction}`, "i"),
      }),
    );
  }

  it("mover el tercero antes lo pone segundo y baja al que estaba ahí", async () => {
    renderWithIntl(<PostMediaField initialItems={tres} />);

    await move(3, "antes");

    expect(trayFileNames()).toEqual(["A.jpg", "C.jpg", "B.jpg"]);
  });

  it("mover el segundo antes lo deja de portada de un solo toque", async () => {
    renderWithIntl(<PostMediaField initialItems={tres} />);

    await move(2, "antes");

    expect(trayFileNames()).toEqual(["B.jpg", "A.jpg", "C.jpg"]);
  });

  it("mover el primero después es como quitarle la portada", async () => {
    renderWithIntl(<PostMediaField initialItems={tres} />);

    await move(1, "después");

    expect(trayFileNames()).toEqual(["B.jpg", "A.jpg", "C.jpg"]);
  });

  it("mover el de en medio después lo baja un puesto", async () => {
    renderWithIntl(<PostMediaField initialItems={tres} />);

    await move(2, "después");

    expect(trayFileNames()).toEqual(["A.jpg", "C.jpg", "B.jpg"]);
  });

  it("dos toques llevan el tercero hasta la portada", async () => {
    /* El recorrido del escenario e2e: no hay un salto directo, se mueve de uno en uno, y lo que
       importa es que los otros dos conserven su orden relativo en vez de intercambiarse. */
    renderWithIntl(<PostMediaField initialItems={tres} />);

    await move(3, "antes");
    await move(2, "antes");

    expect(trayFileNames()).toEqual(["C.jpg", "A.jpg", "B.jpg"]);
  });
});
