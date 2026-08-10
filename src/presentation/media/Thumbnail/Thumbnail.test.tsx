import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Thumbnail from "./Thumbnail";

const URL_REAL =
  "https://firebasestorage.googleapis.com/v0/b/test/o/jugo-verde.jpg?alt=media";

describe("Thumbnail", () => {
  it("pinta la imagen cuando hay URL", () => {
    render(<Thumbnail url={URL_REAL} />);

    expect(screen.getByTestId("thumbnail")).toBeInTheDocument();
  });

  /* Un vídeo no da miniatura, y hay publicaciones sin ningún archivo. En los dos casos el renglón
     se lee igual con su texto: mejor nada que un marco vacío. */
  it.each([[null], [undefined], [""]])("con url %j no pinta nada", (url) => {
    const { container } = render(<Thumbnail url={url} />);

    expect(container).toBeEmptyDOMElement();
  });

  /* Decorativa: el nombre del producto va escrito al lado en todos sus usos, así que nombrarla otra
     vez haría que un lector de pantalla lo dijera dos veces. */
  it("no se anuncia: es decorativa", () => {
    render(<Thumbnail url={URL_REAL} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("thumbnail")).toHaveAttribute("alt", "");
  });

  it("acepta otro tamaño para listas más densas", () => {
    render(<Thumbnail url={URL_REAL} size={64} />);

    expect(screen.getByTestId("thumbnail")).toHaveAttribute("width", "64");
  });
});
