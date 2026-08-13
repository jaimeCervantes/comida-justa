import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PostMediaTray from "./PostMediaTray";

const BASE = "https://firebasestorage.googleapis.com/v0/b/test/o";

function images(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    url: `${BASE}/foto-${index}.jpg`,
    type: "image/jpeg",
  }));
}

describe("PostMediaTray", () => {
  it("no ocupa sitio mientras no hay nada elegido", () => {
    const { container } = renderWithIntl(
      <PostMediaTray items={[]} onRemove={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("enseña un renglón por archivo, numerado en el orden que acaba en sort_order", () => {
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);

    const items = screen.getAllByTestId("post-media-tray-item");

    expect(items).toHaveLength(3);
    expect(
      items.map((item) => within(item).getByText(/^\d$/).textContent),
    ).toEqual(["1", "2", "3"]);
  });

  it("cuenta cuántos van de cuántos caben", () => {
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);

    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      "3 de 10",
    );
  });

  it("avisa al llegar al máximo, que es cuando el selector deja de aceptar", () => {
    renderWithIntl(<PostMediaTray items={images(10)} onRemove={vi.fn()} />);

    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      /Llegaste al máximo/,
    );
  });

  /*
   * Reordenar es opcional en la bandeja: nació sin ello en el slice 1 y el logo de una tienda —un
   * archivo y solo uno— no tiene nada que ordenar. Sin `onMove` no se pinta ni un botón de más.
   */
  it("no ofrece mover cuando nadie escucha el movimiento", () => {
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /mover/i }),
    ).not.toBeInTheDocument();
  });

  it("mueve un archivo diciendo de dónde a dónde", async () => {
    const onMove = vi.fn();
    renderWithIntl(
      <PostMediaTray items={images(3)} onRemove={vi.fn()} onMove={onMove} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /archivo 3 antes/i }),
    );

    expect(onMove).toHaveBeenCalledWith(2, 1);
  });

  it("a los extremos no se les ofrece salir del borde", () => {
    /* Un botón deshabilitado en cada punta sería una parada más del teclado para no hacer nada, en
       una fila que ya lleva una insignia, una cruz y dos flechas por archivo. */
    renderWithIntl(
      <PostMediaTray items={images(3)} onRemove={vi.fn()} onMove={vi.fn()} />,
    );

    expect(
      screen.queryByRole("button", { name: /archivo 1 antes/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /archivo 3 después/i }),
    ).not.toBeInTheDocument();
    // Y el de en medio sí ofrece las dos.
    expect(
      screen.getByRole("button", { name: /archivo 2 antes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archivo 2 después/i }),
    ).toBeInTheDocument();
  });

  it("cada botón de quitar dice qué archivo quita, no solo «quitar»", async () => {
    /* Tres botones idénticos en una fila son inservibles con lector de pantalla: la posición es lo
       único que los distingue, y es además lo que decide cuál queda de portada. */
    const onRemove = vi.fn();
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole("button", { name: /archivo 2/i }));

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it("pinta un vídeo como vídeo y una imagen como imagen", () => {
    renderWithIntl(
      <PostMediaTray
        items={[
          { url: `${BASE}/clip.mp4`, type: "video/mp4" },
          { url: `${BASE}/foto.jpg`, type: "image/jpeg" },
        ]}
        onRemove={vi.fn()}
      />,
    );

    const items = screen.getAllByTestId("post-media-tray-item");

    expect(items[0].querySelector("video")).not.toBeNull();
    expect(
      within(items[1]).getByTestId("post-media-tray-thumbnail"),
    ).toBeInTheDocument();
  });

  it("respeta un tope distinto del de siempre", () => {
    /* La edición reutilizará esta bandeja y podría contar los que ya están guardados. */
    renderWithIntl(
      <PostMediaTray items={images(2)} onRemove={vi.fn()} max={4} />,
    );

    expect(screen.getByTestId("post-media-tray-counter")).toHaveTextContent(
      "2 de 4",
    );
  });
});
