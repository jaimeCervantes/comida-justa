import { describe, expect, it } from "vitest";
import type { Post } from "~/domain/entities/post/types";
import PostValidator from "./PostValidator";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: "Producto de prueba",
    slug: "producto-de-prueba",
    content: "Contenido válido de prueba",
    contactInfo: { phone: "2781092116" },
    media: [{ url: "http://hazlosano.com/x.jpg", type: "image", alt: "x" }],
    user: { id: "user123" },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("PostValidator — kind & origin", () => {
  const validator = new PostValidator();

  it("accepts a plain anuncio without kind/origin", () => {
    expect(() => validator.validate(makePost())).not.toThrow();
  });

  it("accepts a producto with a positive price and a declared origin", () => {
    expect(() =>
      validator.validate(
        makePost({ kind: "producto", price: 120, origin: "productor" }),
      ),
    ).not.toThrow();
  });

  /*
   * Sin procedencia el directorio de productores no se llena solo, que es el punto de la feature.
   * Se le exige a todo producto que pase por aquí —publicar y editar—, y solo pudo ser así desde
   * que la edición también muestra el campo: exigir lo que la pantalla no pregunta es un error
   * incorregible, y por eso durante el slice 1 la regla vivió aparte.
   */
  it("rejects a producto without origin", () => {
    expect(() =>
      validator.validate(makePost({ kind: "producto", price: 120 })),
    ).toThrow(/de dónde viene/i);
  });

  it("does not ask an anuncio where it comes from", () => {
    expect(() => validator.validate(makePost())).not.toThrow();
  });

  it("rejects a producto without price", () => {
    expect(() =>
      validator.validate(makePost({ kind: "producto", price: null })),
    ).toThrow(/precio/i);
  });

  it("rejects a producto with a non-positive price", () => {
    expect(() =>
      validator.validate(makePost({ kind: "producto", price: 0 })),
    ).toThrow(/precio/i);
  });

  it("rejects an invalid kind", () => {
    expect(() =>
      validator.validate(makePost({ kind: "tip" as never })),
    ).toThrow(/kind/i);
  });

  it("rejects an invalid origin", () => {
    expect(() =>
      validator.validate(makePost({ origin: "hazlo_sano" as never })),
    ).toThrow(/origin/i);
  });

  it("accepts a valid origin", () => {
    expect(() =>
      validator.validate(
        makePost({ kind: "producto", price: 50, origin: "hazlo_sano_propio" }),
      ),
    ).not.toThrow();
  });
});

describe("PostValidator — media", () => {
  const validator = new PostValidator();

  function files(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      url: `http://hazlosano.com/${index}.jpg`,
      type: "image",
    }));
  }

  it.each([0, 1, 5, 10])("acepta %i archivos", (count) => {
    expect(() =>
      validator.validate(makePost({ media: files(count) })),
    ).not.toThrow();
  });

  it("acepta ninguno porque editar valida sin tocar la media", () => {
    /* `updateOnePostUseCase` pasa una lista vacía: su formulario no muestra los archivos. Un mínimo
       aquí haría imposible corregir un título. Que publicar exija uno es regla del formulario, y
       vive en `errors.media` de la Server Action, que sí puede contestarle a la persona. */
    expect(() => validator.validate(makePost({ media: [] }))).not.toThrow();
  });

  it("rechaza pasarse del tope, que la base no impone", () => {
    expect(() => validator.validate(makePost({ media: files(11) }))).toThrow(
      /10 archivos/,
    );
  });

  it("rechaza un archivo sin direccion", () => {
    expect(() =>
      validator.validate(makePost({ media: [{ url: "", type: "image" }] })),
    ).toThrow(/dirección/);
  });

  it("rechaza un archivo que no dice si es imagen o video", () => {
    /* `MediaContent` despacha por `type`; sin él la ficha enseñaría un enlace de descarga. */
    expect(() =>
      validator.validate(
        makePost({ media: [{ url: "http://hazlosano.com/x.jpg", type: "" }] }),
      ),
    ).toThrow(/imagen o vídeo/);
  });
});
