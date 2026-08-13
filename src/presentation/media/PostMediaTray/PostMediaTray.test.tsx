import { fireEvent, screen, within } from "@testing-library/react";
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

    await userEvent.click(
      screen.getByRole("button", { name: /quitar el archivo 2/i }),
    );

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

/*
 * La vista grande.
 *
 * La bandeja es un indice, no una galeria: 112 px sirven para reconocer un archivo, no para mirarlo.
 * Quien edita tiene que poder comprobar CUAL de tres etiquetas parecidas esta a punto de quitar, y
 * eso no se decide sobre una miniatura.
 */
describe("PostMediaTray — la vista grande", () => {
  function openSecond(): HTMLElement {
    const thumbnail = screen.getByRole("button", {
      name: /ver el archivo 2 en grande/i,
    });

    return thumbnail;
  }

  it("abre el archivo cuya miniatura se toca", async () => {
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);

    await userEvent.click(openSecond());

    expect(screen.getByRole("dialog")).toHaveAccessibleName(/archivo 2/i);
  });

  /* El foco es lo que distingue una vista grande usable de una trampa: sin devolverlo, quien navega
     con teclado aterriza en `body` y tiene que recorrer el formulario entero para volver. */
  it("devuelve el foco a la miniatura al cerrarse", async () => {
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);
    const thumbnail = openSecond();

    await userEvent.click(thumbnail);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(thumbnail).toHaveFocus();
  });

  /* El tipo que llega aqui es todavia el MIME del archivo recien subido, y `MediaContent` conmuta
     por categoria: sin normalizarlo, un video se pintaba como enlace de descarga. */
  it("abre un vídeo como vídeo aunque llegue con su MIME", async () => {
    renderWithIntl(
      <PostMediaTray
        items={[{ url: `${BASE}/clip.mp4`, type: "video/mp4" }]}
        onRemove={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /ver el archivo 1 en grande/i }),
    );

    const dialog = screen.getByRole("dialog");

    expect(dialog.querySelector("video")).toHaveAttribute("controls");
  });
});

/*
 * El arrastre.
 *
 * Los tres eventos son los que dispara un navegador de verdad, en su orden. `dragover` esta aqui
 * porque sin su `preventDefault` el `drop` no llega nunca: es el requisito menos evidente del
 * arrastrar y soltar de HTML5, y una prueba que lo salte no comprobaria que la fila es un destino
 * valido.
 */
describe("PostMediaTray — arrastrar para ordenar", () => {
  function drag(from: HTMLElement, to: HTMLElement): void {
    fireEvent.dragStart(from);
    fireEvent.dragOver(to);
    fireEvent.drop(to);
  }

  function renderTray(count: number, onMove = vi.fn()) {
    renderWithIntl(
      <PostMediaTray
        items={images(count)}
        onRemove={vi.fn()}
        onMove={onMove}
      />,
    );

    return { onMove, items: screen.getAllByTestId("post-media-tray-item") };
  }

  it("lleva el tercero a la portada de un solo gesto", () => {
    const { onMove, items } = renderTray(3);

    drag(items[2], items[0]);

    expect(onMove).toHaveBeenCalledWith(2, 0);
  });

  it("y de vuelta al final, que es el mismo camino al revés", () => {
    const { onMove, items } = renderTray(3);

    drag(items[0], items[2]);

    expect(onMove).toHaveBeenCalledWith(0, 2);
  });

  it("soltar un archivo sobre sí mismo no es un cambio", () => {
    const { onMove, items } = renderTray(3);

    drag(items[1], items[1]);

    expect(onMove).not.toHaveBeenCalled();
  });

  it("sin quien escuche el movimiento, no hay nada que arrastrar", () => {
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);

    expect(
      screen.getAllByTestId("post-media-tray-item")[0],
    ).not.toHaveAttribute("draggable");
  });

  /* Las flechas no sobran ahora que se puede arrastrar: son el unico camino con teclado. */
  it("deja las flechas donde estaban", () => {
    renderTray(3);

    expect(
      screen.getByRole("button", { name: /archivo 2 antes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /archivo 2 después/i }),
    ).toBeInTheDocument();
  });

  /* Arrastrar no se ve. Sin una linea que lo diga, quien no lo intente nunca lo descubre. */
  it("avisa de que se puede arrastrar, pero solo si hay algo que ordenar", () => {
    const { rerender } = renderWithIntl(
      <PostMediaTray items={images(2)} onRemove={vi.fn()} onMove={vi.fn()} />,
    );

    expect(screen.getByTestId("post-media-tray-hint")).toBeInTheDocument();

    rerender(
      <PostMediaTray items={images(1)} onRemove={vi.fn()} onMove={vi.fn()} />,
    );

    expect(
      screen.queryByTestId("post-media-tray-hint"),
    ).not.toBeInTheDocument();
  });
});
