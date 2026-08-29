import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
 * Se conduce con eventos de puntero porque es lo que la bandeja escucha desde que dejó el arrastrar
 * y soltar de HTML5, que no existe al tacto. Los tres —`pointerdown`, `pointermove`, `pointerup`—
 * son los que dispara un navegador de verdad, y los dos últimos van a `window`, que es donde el
 * componente los oye: el dedo se sale de la miniatura en cuanto empieza a moverse.
 *
 * jsdom no mide nada: `getBoundingClientRect` devuelve ceros para todo, así que sin colocar las
 * miniaturas a mano las tres ocuparían el mismo punto y «soltar sobre la segunda» no querría decir
 * nada. `placeItems` les da una fila de 100 px por miniatura — el mismo papel que juega el
 * navegador cuando esto corre de verdad.
 *
 * La prueba que sí usa un navegador es `src/e2e/multimedia/arrastreTactil.spec.ts`: esta afirma la
 * aritmética del gesto, aquella que el gesto ocurre.
 */
describe("PostMediaTray — arrastrar para ordenar", () => {
  const ITEM_SIZE = 100;

  /** Una fila de miniaturas de 100 px, para que «dónde se soltó» tenga respuesta en jsdom. */
  function placeItems(items: HTMLElement[]): void {
    items.forEach((item, index) => {
      item.getBoundingClientRect = () =>
        ({
          left: index * ITEM_SIZE,
          right: index * ITEM_SIZE + ITEM_SIZE,
          top: 0,
          bottom: ITEM_SIZE,
          x: index * ITEM_SIZE,
          y: 0,
          width: ITEM_SIZE,
          height: ITEM_SIZE,
          toJSON: () => "",
        }) as DOMRect;

      Object.defineProperty(item, "isConnected", {
        value: true,
        configurable: true,
      });
    });
  }

  /** El centro de la miniatura número `index`, en coordenadas de la ventana. */
  const centerOf = (index: number) => ({
    clientX: index * ITEM_SIZE + ITEM_SIZE / 2,
    clientY: ITEM_SIZE / 2,
  });

  function renderTray(count: number, onMove = vi.fn()) {
    renderWithIntl(
      <PostMediaTray
        items={images(count)}
        onRemove={vi.fn()}
        onMove={onMove}
      />,
    );

    const items = screen.getAllByTestId("post-media-tray-item");

    placeItems(items);

    return { onMove, items };
  }

  /** Un arrastre de ratón: apretar, moverse más allá del umbral, soltar encima de otra. */
  function dragWithMouse(items: HTMLElement[], from: number, to: number): void {
    fireEvent.pointerDown(items[from], {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      ...centerOf(from),
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      pointerType: "mouse",
      ...centerOf(to),
    });
    fireEvent.pointerUp(window, {
      pointerId: 1,
      pointerType: "mouse",
      ...centerOf(to),
    });
  }

  it("lleva el tercero a la portada de un solo gesto", () => {
    const { onMove, items } = renderTray(3);

    dragWithMouse(items, 2, 0);

    expect(onMove).toHaveBeenCalledWith(2, 0);
  });

  it("y de vuelta al final, que es el mismo camino al revés", () => {
    const { onMove, items } = renderTray(3);

    dragWithMouse(items, 0, 2);

    expect(onMove).toHaveBeenCalledWith(0, 2);
  });

  it("soltar un archivo sobre sí mismo no es un cambio", () => {
    const { onMove, items } = renderTray(3);

    dragWithMouse(items, 1, 1);

    expect(onMove).not.toHaveBeenCalled();
  });

  /* Soltar fuera de la bandeja es arrepentirse, y arrepentirse no puede reordenar nada. */
  it("soltar fuera de la bandeja no mueve nada", () => {
    const { onMove, items } = renderTray(3);

    fireEvent.pointerDown(items[2], {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      ...centerOf(2),
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 900,
      clientY: 900,
    });
    fireEvent.pointerUp(window, {
      pointerId: 1,
      pointerType: "mouse",
      clientX: 900,
      clientY: 900,
    });

    expect(onMove).not.toHaveBeenCalled();
  });

  it("sin quien escuche el movimiento, no hay nada que arrastrar", () => {
    const onMove = vi.fn();
    renderWithIntl(<PostMediaTray items={images(3)} onRemove={vi.fn()} />);

    const items = screen.getAllByTestId("post-media-tray-item");

    placeItems(items);
    dragWithMouse(items, 2, 0);

    expect(onMove).not.toHaveBeenCalled();
    // Y tampoco se pinta como agarrable, que sería prometer un gesto que no existe.
    expect(items[0].className).not.toMatch(/cursor-grab/);
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

  /* La pista tiene que decir el gesto del teléfono, que es el que no se adivina: sin «mantén
     pulsada», quien lo intente deslizará el dedo, verá bajar la página y concluirá que no se puede
     — que es exactamente lo que pasaba cuando el arrastre era de HTML5. */
  it("la pista nombra el gesto del teléfono, no solo el del ratón", () => {
    renderTray(3);

    expect(screen.getByTestId("post-media-tray-hint")).toHaveTextContent(
      /mantén pulsada/i,
    );
  });
});

/*
 * El dedo.
 *
 * Es la mitad que no existía: `draggable` + `dragstart` es una API de escritorio y ningún navegador
 * móvil la emite para un dedo, así que la bandeja se ordenaba arrastrando sólo con ratón mientras
 * la pista se lo prometía a todo el mundo.
 *
 * Las dos reglas de aquí son las que hacen que el gesto conviva con el formulario que lo rodea:
 * sostener antes de arrastrar, y devolverle el gesto a la página si el dedo se mueve antes.
 */
describe("PostMediaTray — arrastrar con el dedo", () => {
  const ITEM_SIZE = 100;

  function renderTray(count: number) {
    const onMove = vi.fn();

    renderWithIntl(
      <PostMediaTray
        items={images(count)}
        onRemove={vi.fn()}
        onMove={onMove}
      />,
    );

    const items = screen.getAllByTestId("post-media-tray-item");

    items.forEach((item, index) => {
      item.getBoundingClientRect = () =>
        ({
          left: index * ITEM_SIZE,
          right: index * ITEM_SIZE + ITEM_SIZE,
          top: 0,
          bottom: ITEM_SIZE,
          width: ITEM_SIZE,
          height: ITEM_SIZE,
          x: index * ITEM_SIZE,
          y: 0,
          toJSON: () => "",
        }) as DOMRect;

      Object.defineProperty(item, "isConnected", {
        value: true,
        configurable: true,
      });
    });

    return { onMove, items };
  }

  const centerOf = (index: number) => ({
    clientX: index * ITEM_SIZE + ITEM_SIZE / 2,
    clientY: ITEM_SIZE / 2,
  });

  const touch = (index: number) => ({
    pointerId: 7,
    pointerType: "touch" as const,
    button: 0,
    ...centerOf(index),
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sostener y arrastrar lleva el tercero a la portada", () => {
    const { onMove, items } = renderTray(3);

    fireEvent.pointerDown(items[2], touch(2));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerMove(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });
    fireEvent.pointerUp(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });

    expect(onMove).toHaveBeenCalledWith(2, 0);
  });

  /*
   * La regla que hace que la bandeja no secuestre el formulario: quien desliza el dedo sobre una
   * miniatura para bajar por la página está desplazando, no ordenando. Sin esta salida, cada
   * intento de bajar levantaría una foto.
   */
  it("deslizar sin sostener le devuelve el gesto a la página", () => {
    const { onMove, items } = renderTray(3);

    fireEvent.pointerDown(items[2], touch(2));
    // Se mueve antes de que venza el plazo: eso es desplazarse.
    fireEvent.pointerMove(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerUp(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });

    expect(onMove).not.toHaveBeenCalled();
  });

  /* Un toque corto sigue siendo un toque: abre la vista grande y no mueve nada. */
  it("un toque sin sostener abre la vista grande, no reordena", async () => {
    const { onMove, items } = renderTray(3);

    fireEvent.pointerDown(items[1], touch(1));
    fireEvent.pointerUp(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(1),
    });
    fireEvent.click(
      screen.getByRole("button", { name: /ver el archivo 2 en grande/i }),
    );

    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveAccessibleName(/archivo 2/i);
  });

  /*
   * El clic que el navegador emite al final de un arrastre es indistinguible de un toque desde
   * `onClick`. Sin descartarlo, soltar una miniatura encima de otra reordenaba **y** abría la vista
   * grande encima, tapando el resultado que la persona acababa de conseguir.
   */
  it("soltar no abre además la vista grande", () => {
    const { items } = renderTray(3);

    fireEvent.pointerDown(items[2], touch(2));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerMove(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });
    fireEvent.pointerUp(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });
    fireEvent.click(
      screen.getByRole("button", { name: /ver el archivo 3 en grande/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /*
   * Las flechas viven dentro de la misma fila que se arrastra. Sostener el dedo sobre una —que es
   * lo que hace quien no está seguro de haberla tocado— tiene que seguir siendo tocar la flecha.
   */
  it("sostener el dedo sobre una flecha no levanta la miniatura", () => {
    const { onMove } = renderTray(3);

    const arrow = screen.getByRole("button", { name: /archivo 3 antes/i });

    fireEvent.pointerDown(arrow, {
      pointerId: 7,
      pointerType: "touch",
      button: 0,
      ...centerOf(2),
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerMove(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });
    fireEvent.pointerUp(window, {
      pointerId: 7,
      pointerType: "touch",
      ...centerOf(0),
    });

    expect(onMove).not.toHaveBeenCalled();
  });
});
