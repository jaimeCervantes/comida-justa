import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { MediaItem } from "~/presentation/media/MediaContent/MediaContent";
import MediaGallery from "./MediaGallery";

const BASE = "https://firebasestorage.googleapis.com/v0/b/test/o";

function images(count: number): MediaItem[] {
  return Array.from({ length: count }, (_, index) => ({
    url: `${BASE}/foto-${index}.jpg`,
    type: "image",
    alt: `Crema de cacahuate artesanal ${index}`,
    width: 1200,
    height: 1600,
  }));
}

/**
 * Las 23 publicaciones de la base tienen exactamente un archivo. Que ninguna cambie de aspecto es la
 * mitad del trabajo de este componente, y la que más fácil se rompe al añadirle algo.
 */
describe("MediaGallery — con un solo archivo no hay galería", () => {
  it("no saca flechas, ni miniaturas, ni contador", () => {
    renderWithIntl(<MediaGallery items={images(1)} />);

    expect(screen.queryByTestId("media-gallery")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /siguiente archivo/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("media-gallery-counter"),
    ).not.toBeInTheDocument();
  });

  it("pinta el archivo con su forma real, como antes", () => {
    renderWithIntl(<MediaGallery items={images(1)} />);

    expect(screen.getByTestId("media-image-sized")).toBeInTheDocument();
  });

  it("sin ningún archivo enseña el hueco de siempre, no una galería vacía", () => {
    /* Hay publicaciones migradas sin media; antes de esto el detalle caía a `{url:"",type:""}` y
       `MediaContent` respondía con su placeholder. */
    renderWithIntl(<MediaGallery items={[]} />);

    expect(screen.getByTestId("media-placeholder")).toBeInTheDocument();
  });
});

describe("MediaGallery — con varios archivos", () => {
  it("enseña una miniatura por archivo y empieza por el primero", () => {
    renderWithIntl(<MediaGallery items={images(3)} />);

    expect(screen.getAllByTestId("media-gallery-thumbnail")).toHaveLength(3);
    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "1 / 3",
    );
  });

  it("«siguiente» avanza el archivo grande y el contador", async () => {
    renderWithIntl(<MediaGallery items={images(3)} />);

    await userEvent.click(
      screen.getByRole("button", { name: /siguiente archivo/i }),
    );

    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "2 / 3",
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "alt",
      "Crema de cacahuate artesanal 1",
    );
  });

  it("la miniatura salta directamente a su archivo", async () => {
    renderWithIntl(<MediaGallery items={images(3)} />);

    await userEvent.click(
      screen.getByRole("button", { name: /archivo 3 de 3/i }),
    );

    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "3 / 3",
    );
  });

  it("da la vuelta en los dos extremos", async () => {
    /* Llegar al último y que «siguiente» no haga nada se lee como que la galería se rompió. */
    renderWithIntl(<MediaGallery items={images(3)} />);

    await userEvent.click(
      screen.getByRole("button", { name: /archivo anterior/i }),
    );

    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "3 / 3",
    );

    await userEvent.click(
      screen.getByRole("button", { name: /siguiente archivo/i }),
    );

    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "1 / 3",
    );
  });

  it("se recorre con las flechas del teclado", async () => {
    /* Quien navega con teclado llega primero a las miniaturas; desde ahí las flechas tienen que
       mover la galería, no solo la selección del navegador. El manejador vive en el contenedor y
       recoge lo que burbujea desde dentro. */
    renderWithIntl(<MediaGallery items={images(3)} />);

    await userEvent.click(screen.getAllByTestId("media-gallery-thumbnail")[0]);
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "2 / 3",
    );

    await userEvent.keyboard("{ArrowLeft}");

    expect(screen.getByTestId("media-gallery-counter")).toHaveTextContent(
      "1 / 3",
    );
  });

  it("marca cuál es la miniatura activa", async () => {
    renderWithIntl(<MediaGallery items={images(3)} />);

    const thumbnails = screen.getAllByTestId("media-gallery-thumbnail");

    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");

    await userEvent.click(thumbnails[2]);

    expect(thumbnails[0]).toHaveAttribute("aria-current", "false");
    expect(thumbnails[2]).toHaveAttribute("aria-current", "true");
  });

  it("anuncia el contador para quien no lo ve cambiar", () => {
    renderWithIntl(<MediaGallery items={images(4)} />);

    expect(screen.getByTestId("media-gallery-counter")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("pinta un vídeo como vídeo cuando es el archivo activo", async () => {
    const { container } = renderWithIntl(
      <MediaGallery
        items={[
          { url: `${BASE}/foto.jpg`, type: "image", alt: "Foto" },
          { url: `${BASE}/clip.mp4`, type: "video", alt: "Clip" },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /siguiente archivo/i }),
    );

    /* El grande, no la miniatura: `controls` lo distingue de las miniaturas mudas. */
    expect(container.querySelector("video[controls]")).not.toBeNull();
  });
});
