import { describe, expect, it } from "vitest";
import type { Post } from "~/domain/entities/post/types";
import PostValidator from "./PostValidator";

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    title: "Producto de prueba",
    slug: "producto-de-prueba",
    content: "Contenido válido de prueba",
    contactInfo: { phone: "2781092116" },
    media: { url: "http://hazlosano.com/x.jpg", type: "image", alt: "x" },
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
