import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CARD_MASONRY } from "./cardList";
import MasonryColumns, {
  assignToColumns,
  GAP,
  MIN_COLUMN_WIDTH,
} from "./MasonryColumns";

/**
 * El reparto es lo único que se prueba aquí, y a propósito: es la regla, y es pura. Lo demás
 * —medir, observar el ancho— es el navegador, y jsdom no maqueta nada, así que afirmarlo ahí sería
 * afirmar sobre ceros.
 */
describe("assignToColumns", () => {
  it("manda cada tarjeta a la columna más corta hasta ese momento", () => {
    // 400 → col0; 200 → col1; 200 → col2; la cuarta va a la más corta de las tres.
    expect(assignToColumns([400, 200, 200, 100], 3)).toEqual([0, 1, 2, 1]);
  });

  it("con una sola columna, todas van a la misma", () => {
    expect(assignToColumns([400, 200, 300], 1)).toEqual([0, 0, 0]);
  });

  /**
   * La propiedad que arregla el fallo reportado: colocar la número 10 no puede cambiar dónde
   * quedaron las nueve anteriores, porque su decisión ya estaba tomada cuando solo existían ellas.
   *
   * Es lo que la multi-columna de CSS no puede dar: `column-fill: balance` reparte de nuevo TODAS
   * las tarjetas al añadir una, y por eso lo ya visto se movía al cargar más.
   */
  it("es estable al añadir: lo ya colocado no se mueve", () => {
    const primeras = [400, 200, 200, 100, 350, 150, 500, 120, 260];
    const siguientes = [300, 180, 420, 200, 260, 340, 190, 280, 210];

    const antes = assignToColumns(primeras, 3);
    const despues = assignToColumns([...primeras, ...siguientes], 3);

    expect(despues.slice(0, primeras.length)).toEqual(antes);
  });

  it("y lo sigue siendo tanda tras tanda", () => {
    const alturas = Array.from(
      { length: 45 },
      (_, i) => 150 + ((i * 37) % 300),
    );

    for (let corte = 9; corte < alturas.length; corte += 9) {
      const antes = assignToColumns(alturas.slice(0, corte), 3);
      const despues = assignToColumns(alturas.slice(0, corte + 9), 3);

      expect(despues.slice(0, corte)).toEqual(antes);
    }
  });

  /* No promete un reparto óptimo —el voraz no lo da—, pero sí que ninguna columna se quede muy
     descolgada, que es lo que se veía como hueco. */
  it("deja las columnas parejas: ninguna se descuelga de la más alta", () => {
    const alturas = Array.from(
      { length: 30 },
      (_, i) => 150 + ((i * 53) % 280),
    );
    const asignacion = assignToColumns(alturas, 3);

    const totales = [0, 0, 0];
    alturas.forEach((alto, i) => {
      totales[asignacion[i]] += alto + 16;
    });

    const masAlta = Math.max(...totales);
    const masCorta = Math.min(...totales);

    // La diferencia no puede pasar de lo que mide la tarjeta más alta: es la cota del voraz.
    expect(masAlta - masCorta).toBeLessThanOrEqual(Math.max(...alturas) + 16);
  });

  it("no deja columnas vacías cuando hay tarjetas de sobra", () => {
    const asignacion = assignToColumns([200, 200, 200, 200, 200, 200], 3);

    expect(new Set(asignacion)).toEqual(new Set([0, 1, 2]));
  });
});

/**
 * Cómo se dejan medir las tarjetas en jsdom, que no maqueta: cada una declara su altura y el
 * envoltorio que `MasonryColumns` le pone alrededor la devuelve como si el navegador la hubiera
 * calculado. Es la única forma de ejercitar el camino "ya hay medidas" fuera de un navegador.
 */
function conAncho(ancho: number): void {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => ancho,
  });
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value(this: HTMLElement) {
      const alto = Number(
        this.firstElementChild?.getAttribute("data-alto") ?? 0,
      );

      return { height: alto, width: ancho } as DOMRect;
    },
  });
}

function tarjetas(alturas: readonly number[]) {
  return alturas.map((alto, indice) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: son datos de prueba, no se reordenan.
    <article key={indice} data-alto={alto}>
      tarjeta {indice}
    </article>
  ));
}

/**
 * El fallo que trajo aquí: el home abría en el teléfono con tres columnas apretadas que de golpe
 * se convertían en una. El reparto se corregía en `useLayoutEffect`, que solo cubre los renders
 * posteriores a la hidratación — el primer pintado es el HTML del servidor, y salía con un número
 * de columnas inventado porque el servidor no tiene ancho que medir.
 */
describe("MasonryColumns, antes de haber medido nada", () => {
  afterEach(() => {
    // @ts-expect-error se quita la propiedad para devolver el prototipo a su estado original.
    delete HTMLElement.prototype.clientWidth;
    // @ts-expect-error idem.
    delete HTMLElement.prototype.getBoundingClientRect;
  });

  it("no inventa columnas: deja el reparto a la multi-columna de CSS", () => {
    render(
      <MasonryColumns testId="listado">{tarjetas([0, 0])}</MasonryColumns>,
    );

    expect(screen.queryAllByTestId("masonry-column")).toHaveLength(0);
    expect(screen.getByTestId("listado")).toHaveClass("columns-[300px]");
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("y en cuanto hay ancho y alturas, reparte cada tarjeta a la columna más corta", () => {
    conAncho(1216);

    render(
      <MasonryColumns testId="listado">
        {tarjetas([400, 200, 200, 100])}
      </MasonryColumns>,
    );

    const columnas = screen.getAllByTestId("masonry-column");

    // El mismo reparto que afirma `assignToColumns`: [0, 1, 2, 1].
    expect(columnas).toHaveLength(3);
    expect(columnas.map((columna) => columna.textContent)).toEqual([
      "tarjeta 0",
      "tarjeta 1tarjeta 3",
      "tarjeta 2",
    ]);
  });

  /* En una sola columna CSS ya hace exactamente lo que haría el reparto —las tarjetas en orden,
     una debajo de otra—, así que no hay razón para tocar el DOM. Es el caso del teléfono, que es
     donde se reportó el fallo: ahí el JavaScript no llega a mover nada. */
  it("y cuando solo cabe una columna, se queda en CSS y no toca el DOM", () => {
    conAncho(358);

    render(
      <MasonryColumns testId="listado">
        {tarjetas([400, 200, 200])}
      </MasonryColumns>,
    );

    expect(screen.queryAllByTestId("masonry-column")).toHaveLength(0);
    expect(screen.getByTestId("listado")).toHaveClass("columns-[300px]");
  });
});

/**
 * Las dos maquetaciones tienen que medir la columna igual, o el número de columnas cambiaría al
 * hidratar y volvería el brinco. Viven en sitios distintos —una clase de Tailwind y dos constantes
 * de TypeScript— porque Tailwind no puede leer un valor de JavaScript, así que lo vigila este test.
 */
describe("El primer pintado y el reparto medido miden la columna igual", () => {
  it("la clase de CSS lleva los mismos números que las constantes del reparto", () => {
    expect(CARD_MASONRY).toContain(`columns-[${MIN_COLUMN_WIDTH}px]`);
    // La escala de espaciado de Tailwind va de 4 en 4 píxeles: `gap-4` son 16.
    expect(CARD_MASONRY).toContain(`gap-${GAP / 4}`);
  });
});
