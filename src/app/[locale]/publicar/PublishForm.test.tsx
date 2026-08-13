import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PublishForm from "./PublishForm";

/**
 * El hook de subida, falso.
 *
 * Se sustituye entero y no solo `fetch` porque lo que se prueba aquí es **la aritmética de la
 * lista** —acumular, deduplicar, quitar, recortar—, y esa vive en el formulario. Cloud Storage y sus
 * tres llamadas son cosa del hook, y meterlas en esta prueba solo añadiría formas de que falle por
 * algo que no está midiendo.
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

const noop = vi.fn();

function imageFile(name: string): File {
  return new File(["contenido"], name, { type: "image/jpeg" });
}

function fileInput(): HTMLInputElement {
  return document.querySelector('form input[type="file"]') as HTMLInputElement;
}

function hiddenMediaValue(): unknown {
  const input = document.querySelector(
    'input[name="media"]',
  ) as HTMLInputElement;

  return JSON.parse(input.value);
}

beforeEach(() => {
  uploadedCount = 0;
});

const ALIMENTACION = { value: "alimentacion", label: "Alimentación" } as const;
const JUGOS = { value: "jugos", label: "Jugos" } as const;

function renderForm(
  props: {
    hasStore?: boolean;
    categoryOptions?: readonly { value: string; label: string }[];
    subCategoryOptionsByCategory?: Record<
      string,
      readonly { value: string; label: string }[]
    >;
  } = {},
) {
  return renderWithIntl(
    <PublishForm
      action={noop}
      categoryOptions={[]}
      subCategoryOptionsByCategory={{}}
      {...props}
    />,
  );
}

async function selectProduct(): Promise<void> {
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: /tipo de publicación/i }),
    "producto",
  );
}

/**
 * El aviso existe para un caso y no para tres: declararse productor sin tienda es lo único que no
 * significa nada todavía —sin ubicación no hay distancia que verificar y no se entra a productores
 * locales—. Revender no exige tienda para ser cierto, y a quien ya la tiene no hay que decirle nada.
 */
describe("PublishForm — el aviso de abrir tienda", () => {
  it("aparece al declararse productor sin tener tienda", async () => {
    renderForm({ hasStore: false });
    await selectProduct();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
      "productor",
    );

    expect(screen.getByTestId("producer-needs-store")).toHaveTextContent(
      /tienda con ubicación/i,
    );
  });

  it("no aparece al declarar una reventa", async () => {
    renderForm({ hasStore: false });
    await selectProduct();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
      "reventa_cercana",
    );

    expect(
      screen.queryByTestId("producer-needs-store"),
    ).not.toBeInTheDocument();
  });

  it("no aparece a quien ya tiene tienda", async () => {
    renderForm({ hasStore: true });
    await selectProduct();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
      "productor",
    );

    expect(
      screen.queryByTestId("producer-needs-store"),
    ).not.toBeInTheDocument();
  });

  /* Un anuncio ni siquiera pregunta procedencia, así que no hay nada que avisar. */
  it("no aparece en un anuncio", () => {
    renderForm({ hasStore: false });

    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("producer-needs-store"),
    ).not.toBeInTheDocument();
  });
});

/**
 * La categoría se ofrecía solo en `producto`, por considerarla ruido en un anuncio. El efecto era
 * que todo anuncio se guardaba con `category` en null, y sin categoría no hay forma de saber a qué
 * pilar pertenece: ninguna pantalla de pilar podía mostrarlos.
 */
describe("PublishForm — la categoría", () => {
  it("se pregunta en un anuncio, que es el kind por defecto", () => {
    renderForm({ categoryOptions: [ALIMENTACION] });

    expect(
      screen.getByRole("combobox", { name: /categoría/i }),
    ).toBeInTheDocument();
  });

  it("se sigue preguntando en un producto", async () => {
    renderForm({ categoryOptions: [ALIMENTACION] });
    await selectProduct();

    expect(
      screen.getByRole("combobox", { name: /categoría/i }),
    ).toBeInTheDocument();
  });

  it("ofrece sub-categoría en un anuncio una vez elegida la categoría", async () => {
    // Sin categoría no hay sub-categoría que ofrecer: la base rechaza la huérfana.
    renderForm({
      categoryOptions: [ALIMENTACION],
      subCategoryOptionsByCategory: { alimentacion: [JUGOS] },
    });

    expect(
      screen.queryByRole("combobox", { name: /sub-?categoría/i }),
    ).not.toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /categoría/i }),
      "alimentacion",
    );

    expect(
      screen.getByRole("combobox", { name: /sub-?categoría/i }),
    ).toBeInTheDocument();
  });
});

/**
 * Cada subida pisaba la anterior (`setMediaJSON(JSON.stringify(data?.media))`), así que no había
 * forma de juntar dos archivos ni queriendo. Lo que sigue describe la lista: qué la hace crecer, qué
 * la hace encoger, y qué acaba viajando en el campo oculto —que es lo único que la Server Action
 * llega a ver—.
 */
describe("PublishForm — la bandeja de archivos", () => {
  it("empieza vacía y sin bandeja que enseñar", () => {
    renderForm();

    expect(screen.queryByTestId("post-media-tray")).not.toBeInTheDocument();
    expect(hiddenMediaValue()).toEqual([]);
  });

  it("guarda los tres archivos elegidos de una vez, en su orden", async () => {
    renderForm();

    await userEvent.upload(fileInput(), [
      imageFile("frente.jpg"),
      imageFile("etiqueta.jpg"),
      imageFile("interior.jpg"),
    ]);

    expect(screen.getAllByTestId("post-media-tray-item")).toHaveLength(3);
    expect(
      screen
        .getAllByTestId("post-media-tray-item")
        .map((item) => within(item).getByText(/^\d$/).textContent),
    ).toEqual(["1", "2", "3"]);
    expect(hiddenMediaValue()).toHaveLength(3);
  });

  it("suma la segunda tanda en vez de reemplazar la primera", async () => {
    renderForm();

    await userEvent.upload(fileInput(), [imageFile("frente.jpg")]);
    await userEvent.upload(fileInput(), [imageFile("etiqueta.jpg")]);

    expect(screen.getAllByTestId("post-media-tray-item")).toHaveLength(2);
    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      "2 de 10",
    );
  });

  it("quitar el de en medio deja los otros dos y los renumera", async () => {
    renderForm();

    await userEvent.upload(fileInput(), [
      imageFile("frente.jpg"),
      imageFile("etiqueta.jpg"),
      imageFile("interior.jpg"),
    ]);

    await userEvent.click(screen.getByRole("button", { name: /archivo 2/i }));

    const urls = (hiddenMediaValue() as Array<{ url: string }>).map(
      (file) => file.url,
    );

    expect(urls).toHaveLength(2);
    expect(urls[0]).toMatch(/frente\.jpg$/);
    expect(urls[1]).toMatch(/interior\.jpg$/);
    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      "2 de 10",
    );
  });

  it("el campo oculto lleva la lista entera, que es lo único que ve el servidor", async () => {
    renderForm();

    await userEvent.upload(fileInput(), [
      imageFile("frente.jpg"),
      imageFile("etiqueta.jpg"),
    ]);

    expect(hiddenMediaValue()).toEqual([
      expect.objectContaining({ url: expect.stringMatching(/frente\.jpg$/) }),
      expect.objectContaining({ url: expect.stringMatching(/etiqueta\.jpg$/) }),
    ]);
  });

  it("de doce elegidos entran los diez que caben", async () => {
    /* Elegir la galería entera del teléfono es el caso normal, no el raro. Recortar es mejor que
       rechazar la selección completa y dejar a la persona empezando de nuevo. */
    renderForm();

    await userEvent.upload(
      fileInput(),
      Array.from({ length: 12 }, (_, index) => imageFile(`foto-${index}.jpg`)),
    );

    expect(screen.getAllByTestId("post-media-tray-item")).toHaveLength(10);
    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      /Llegaste al máximo/,
    );
  });

  it("al llegar al tope el selector deja de aceptar", async () => {
    renderForm();

    await userEvent.upload(
      fileInput(),
      Array.from({ length: 10 }, (_, index) => imageFile(`foto-${index}.jpg`)),
    );

    expect(fileInput()).toBeDisabled();
  });

  it("cambia la invitación una vez hay algo elegido", async () => {
    renderForm();

    expect(
      screen.getByLabelText(/sube tus mejores imágenes o videos/i),
    ).toBeInTheDocument();

    await userEvent.upload(fileInput(), [imageFile("frente.jpg")]);

    expect(
      screen.getByLabelText(/agrega otra imagen u otro video/i),
    ).toBeInTheDocument();
  });
});
