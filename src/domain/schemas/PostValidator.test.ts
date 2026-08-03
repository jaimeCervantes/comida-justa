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

  it("accepts a producto with a positive price", () => {
    expect(() =>
      validator.validate(makePost({ kind: "producto", price: 120 })),
    ).not.toThrow();
  });

  /*
   * Sin procedencia el directorio de productores no se llena solo, que es el punto de la feature.
   * Solo se le exige a lo nuevo: editar no recibe el campo, y romper la edición de los productos
   * que ya existen por algo que su formulario no muestra sería un error incorregible.
   */
  it("rejects a new producto without origin", () => {
    expect(() =>
      validator.validateNewPost(makePost({ kind: "producto", price: 120 })),
    ).toThrow(/de dónde viene/i);
  });

  it("accepts a new producto that declares its origin", () => {
    expect(() =>
      validator.validateNewPost(
        makePost({ kind: "producto", price: 120, origin: "productor" }),
      ),
    ).not.toThrow();
  });

  it("does not ask an anuncio where it comes from", () => {
    expect(() => validator.validateNewPost(makePost())).not.toThrow();
  });

  it("keeps editing an existing producto without origin possible", () => {
    expect(() =>
      validator.validate(makePost({ kind: "producto", price: 120 })),
    ).not.toThrow();
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
