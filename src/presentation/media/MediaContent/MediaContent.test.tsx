import { describe, expect, it } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import MediaContent from "./MediaContent";

describe("When a publication has no usable media", () => {
  // El defecto que documenta `docs/planning/001-2026-07-30-pendientes.md`: el listado respondía 500 porque
  // `DefaultContent` leía `media.url` sobre un `undefined`.
  it.each([
    ["undefined", undefined],
    ["sin url", { url: "", type: "image", alt: "" }],
  ])("degrada a un marcador en vez de reventar (%s)", (_name, media) => {
    const { getByTestId } = render(<MediaContent media={media} />);

    expect(getByTestId("media-placeholder")).toHaveTextContent(
      "Publicación sin imagen",
    );
  });
});

describe("When a publication has media", () => {
  it("pinta la imagen", () => {
    const { getByAltText } = render(
      <MediaContent
        media={{
          url: "https://firebasestorage.googleapis.com/v0/b/test/o/seed.jpg",
          type: "image",
          alt: "Jugo Verde",
        }}
      />,
    );

    expect(getByAltText("Jugo Verde")).toBeInTheDocument();
  });
});

/**
 * La corrida de escritorio de «Qué se declara según lo que se sepa del archivo».
 *
 * `next/image` deriva la proporción del hueco de `width`/`height`, así que declararlas 1000x1000
 * para todas anunciaba cuadrada una foto de 1200x1600 — y la tarjeta la recortaba a 256 px. Los
 * tamaños son los reales de la base, medidos el 2026-08-08.
 */
describe("Cuando se sabe la forma del archivo", () => {
  const IMAGE = {
    url: "https://firebasestorage.googleapis.com/v0/b/test/o/seed.jpg",
    type: "image",
    alt: "Jugo Verde",
  };

  it.each([
    ["vertical", 1200, 1600],
    ["apaisada", 1600, 1200],
    ["la más alta de la base", 1536, 2048],
  ])("declara la proporción real de una %s", (_shape, width, height) => {
    const { getByTestId } = render(
      <MediaContent media={{ ...IMAGE, width, height }} />,
    );

    const image = getByTestId("media-image-sized");

    expect(image).toHaveAttribute("width", String(width));
    expect(image).toHaveAttribute("height", String(height));
    // Sin alto impuesto no hay nada que recortar, así que `object-cover` sobra.
    expect(image.className).not.toContain("object-cover");
  });

  /* `NULL` es "no lo sabemos", no "es cuadrada": son los 8 vídeos y todo lo publicado antes de
     que el formulario las capture. Ahí se conserva el comportamiento anterior, recorte incluido. */
  it.each([
    ["sin ninguna", {}],
    ["solo el ancho", { width: 1200 }],
    ["solo el alto", { height: 1600 }],
    ["un cero, que no es una medida", { width: 0, height: 1600 }],
    ["nulas explícitas", { width: null, height: null }],
  ])("cae al cuadrado de siempre %s", (_case, dimensions) => {
    const { getByTestId } = render(
      <MediaContent media={{ ...IMAGE, ...dimensions }} />,
    );

    const image = getByTestId("media-image-unsized");

    expect(image).toHaveAttribute("width", "1000");
    expect(image).toHaveAttribute("height", "1000");
    expect(image.className).toContain("object-cover");
  });
});
