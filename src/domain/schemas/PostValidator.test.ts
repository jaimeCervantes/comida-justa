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

/**
 * La tabla del `.feature`: qué se le exige a cada tipo, leída de un golpe.
 *
 * Un evento exige justo lo contrario que un producto — la fecha es obligatoria, el precio es
 * opcional y la procedencia ni se menciona— y por eso su regla vive al lado de la del producto.
 */
describe("PostValidator — el evento y su fecha", () => {
  const validator = new PostValidator();
  const CUANDO = "2026-08-22T06:00:00Z";

  it("un evento gratis es normal, y se acepta", () => {
    expect(() =>
      validator.validate(
        makePost({
          title: "Rodada del sábado en el kiosco",
          kind: "evento",
          startsAt: CUANDO,
        }),
      ),
    ).not.toThrow();
  });

  it("y uno de paga también", () => {
    expect(() =>
      validator.validate(
        makePost({ kind: "evento", price: 150, startsAt: CUANDO }),
      ),
    ).not.toThrow();
  });

  /* Es lo que lo hace evento: sin fecha es un anuncio con otro nombre. */
  it.each([undefined, null, "", "el sábado por la mañana"])(
    "sin fecha utilizable (%s) se rechaza",
    (startsAt) => {
      expect(() =>
        validator.validate(
          makePost({ kind: "evento", startsAt: startsAt as string }),
        ),
      ).toThrow(/cuándo ocurre/i);
    },
  );

  /* A un evento NO se le pide procedencia: responde "¿lo haces o lo revendes?" y eso solo significa
     algo en mercancía. Una meditación no se revende. */
  it("no necesita procedencia, al revés que un producto", () => {
    expect(() =>
      validator.validate(
        makePost({ kind: "evento", startsAt: CUANDO, origin: null }),
      ),
    ).not.toThrow();
  });

  it("un rango al revés se rechaza antes de llegar a la base", () => {
    expect(() =>
      validator.validate(
        makePost({
          kind: "evento",
          startsAt: CUANDO,
          endsAt: "2026-08-22T05:00:00Z",
        }),
      ),
    ).toThrow(/terminar antes de empezar/i);
  });

  it("un rango correcto pasa", () => {
    expect(() =>
      validator.validate(
        makePost({
          kind: "evento",
          startsAt: CUANDO,
          endsAt: "2026-08-22T08:00:00Z",
        }),
      ),
    ).not.toThrow();
  });

  /* Lo que ya existía no gana requisitos: 17 productos y 10 anuncios sin fecha siguen siendo
     válidos. */
  it("a un producto y a un anuncio no se les pide fecha", () => {
    expect(() =>
      validator.validate(
        makePost({ kind: "producto", price: 35, origin: "hazlo_sano_propio" }),
      ),
    ).not.toThrow();
    expect(() =>
      validator.validate(makePost({ kind: "anuncio" })),
    ).not.toThrow();
  });
});

/**
 * El servicio: precio como el producto, duración como nadie más, y procedencia ninguna.
 *
 * La duración se exige **ya**, aunque la agenda no exista: si se dejara para entonces, ese día
 * habría servicios publicados sin ella y habría que perseguir a sus dueños.
 */
describe("PostValidator — el servicio y su duración", () => {
  const validator = new PostValidator();

  const servicio = (overrides: Partial<Post> = {}) =>
    makePost({
      title: "Consulta nutricional",
      kind: "servicio",
      price: 500,
      durationMinutes: 45,
      ...overrides,
    });

  it("con precio y duración se acepta", () => {
    expect(() => validator.validate(servicio())).not.toThrow();
  });

  /* Un masaje siempre lo das tú: `origin` responde "¿lo haces o lo revendes?" y ahí no significa
     nada, al revés que en un producto. */
  it("no necesita procedencia, al revés que un producto", () => {
    expect(() => validator.validate(servicio({ origin: null }))).not.toThrow();
  });

  it.each([undefined, null, 0, -30])(
    "sin precio utilizable (%s) se rechaza",
    (price) => {
      expect(() =>
        validator.validate(servicio({ price: price as number })),
      ).toThrow(/precio mayor a cero/i);
    },
  );

  it.each([undefined, null, 0, -45, 30.5])(
    "sin duración utilizable (%s) se rechaza",
    (duration) => {
      expect(() =>
        validator.validate(servicio({ durationMinutes: duration as number })),
      ).toThrow(/cuánto dura/i);
    },
  );

  /* Lo que ya existía no gana requisitos: a un producto y a un evento nadie les pide duración. */
  it("a los demás tipos no se les pide duración", () => {
    expect(() =>
      validator.validate(
        makePost({ kind: "producto", price: 35, origin: "hazlo_sano_propio" }),
      ),
    ).not.toThrow();
    expect(() =>
      validator.validate(
        makePost({ kind: "evento", startsAt: "2026-08-22T06:00:00Z" }),
      ),
    ).not.toThrow();
  });
});
