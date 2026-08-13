import { describe, expect, it } from "vitest";
import {
  MAX_POST_MEDIA_FILES,
  mediaTypeFromMime,
  parsePostMediaPayload,
} from "./mediaPayload";

/** Como lo serializa el formulario tras subir a Cloud Storage. */
function uploaded(index: number, type = "image/jpeg") {
  return {
    url: `https://firebasestorage.googleapis.com/posts/foto-${index}.jpg`,
    type,
    path: `posts/image/jpeg/foto-${index}.jpg`,
    width: 1200,
    height: 1600,
  };
}

describe("mediaTypeFromMime", () => {
  it.each([
    ["image/jpeg", "image"],
    ["image/webp", "image"],
    ["video/mp4", "video"],
    ["video/quicktime", "video"],
    /* Los dos valores que hoy tiene la base ya vienen reducidos: quien los relee no debe
       convertirlos en otra cosa. */
    ["image", "image"],
    ["video", "video"],
  ])("reduce %s a su categoria %s", (mime, expected) => {
    expect(mediaTypeFromMime(mime)).toBe(expected);
  });

  it("cae a imagen cuando no hay MIME que reducir", () => {
    /* `MediaContent` despacha por este valor y su rama por omisión es un enlace de descarga. Una
       cadena vacía dejaría a la publicación enseñando "Descargar archivo" en vez de la foto. */
    expect(mediaTypeFromMime(undefined)).toBe("image");
    expect(mediaTypeFromMime("")).toBe("image");
  });
});

describe("parsePostMediaPayload", () => {
  it("conserva el orden en que se subieron, que es el que acaba en sort_order", () => {
    const payload = JSON.stringify([uploaded(1), uploaded(2), uploaded(3)]);

    const media = parsePostMediaPayload(payload);

    expect(media.map((file) => file.url)).toEqual([
      uploaded(1).url,
      uploaded(2).url,
      uploaded(3).url,
    ]);
  });

  it("acepta el objeto unico que mandaba el formulario anterior", () => {
    /* No es cortesía con el pasado: mientras haya una pestaña abierta con el formulario viejo, su
       envío sigue llegando aquí. */
    const media = parsePostMediaPayload(JSON.stringify(uploaded(1)));

    expect(media).toHaveLength(1);
    expect(media[0].url).toBe(uploaded(1).url);
  });

  it("descarta lo que no trae direccion sin tumbar el resto", () => {
    const payload = JSON.stringify([
      uploaded(1),
      { type: "image/jpeg", width: 10 },
      uploaded(2),
    ]);

    const media = parsePostMediaPayload(payload);

    expect(media.map((file) => file.url)).toEqual([
      uploaded(1).url,
      uploaded(2).url,
    ]);
  });

  it("reduce el MIME a la categoria que guarda post_media", () => {
    const payload = JSON.stringify([
      uploaded(1, "image/jpeg"),
      uploaded(2, "video/mp4"),
    ]);

    expect(parsePostMediaPayload(payload).map((file) => file.type)).toEqual([
      "image",
      "video",
    ]);
  });

  it("recorta al tope, porque el navegador no es el ultimo que decide", () => {
    const many = Array.from({ length: 12 }, (_, index) => uploaded(index));

    expect(parsePostMediaPayload(JSON.stringify(many))).toHaveLength(
      MAX_POST_MEDIA_FILES,
    );
  });

  it.each([
    ["texto que no es JSON", "no-soy-json"],
    ["una lista vacia", "[]"],
    ["una cadena vacia", ""],
    ["nada", null],
  ])("devuelve vacio ante %s en vez de lanzar", (_caso, payload) => {
    /* Un JSON roto no puede tumbar la publicación: quien decide qué contestarle a la persona es la
       Server Action, que además tiene el catálogo a mano. */
    expect(parsePostMediaPayload(payload)).toEqual([]);
  });

  it("pone el titulo como alt de todos los archivos", () => {
    const payload = JSON.stringify([uploaded(1), uploaded(2)]);

    const media = parsePostMediaPayload(payload, {
      alt: "Crema de cacahuate artesanal",
    });

    expect(media.map((file) => file.alt)).toEqual([
      "Crema de cacahuate artesanal",
      "Crema de cacahuate artesanal",
    ]);
  });

  it("conserva las dimensiones utiles y descarta las que no lo son", () => {
    /* El `CHECK` de `post_media` rechaza cero y negativos; llegar hasta la base para que la rechace
       convertiría un dato dudoso en un error de publicación. */
    const payload = JSON.stringify([
      { url: "https://x/1.jpg", type: "image/jpeg", width: 1200, height: 1600 },
      { url: "https://x/2.jpg", type: "image/jpeg", width: 0, height: -3 },
      { url: "https://x/3.jpg", type: "video/mp4" },
    ]);

    expect(
      parsePostMediaPayload(payload).map((file) => [file.width, file.height]),
    ).toEqual([
      [1200, 1600],
      [undefined, undefined],
      [undefined, undefined],
    ]);
  });
});
