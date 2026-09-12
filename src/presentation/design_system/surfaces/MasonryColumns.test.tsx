import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CARD_MASONRY } from "./cardList";
import MasonryColumns, {
  assignToColumns,
  COLUMN_WIDTH,
  columnsFor,
  GAP,
  MAX_COLUMNS,
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
    expect(screen.getByTestId("listado")).toHaveClass("card-columns");
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("y en cuanto hay ancho y alturas, reparte cada tarjeta a la columna más corta", () => {
    // 720 px es una tableta: tres columnas. Ver la corrida de escritorio de `columnsFor`.
    conAncho(720);

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
     una debajo de otra—, así que no hay razón para tocar el DOM. Es el caso del teléfono de pie,
     que es donde se reportó el fallo: ahí el JavaScript no llega a mover nada. */
  it("y cuando solo cabe una columna, se queda en CSS y no toca el DOM", () => {
    conAncho(358);

    render(
      <MasonryColumns testId="listado">
        {tarjetas([400, 200, 200])}
      </MasonryColumns>,
    );

    expect(screen.queryAllByTestId("masonry-column")).toHaveLength(0);
    expect(screen.getByTestId("listado")).toHaveClass("card-columns");
  });
});

/**
 * La escalera de columnas, leída como una corrida de escritorio.
 *
 * Los anchos son de contenido, ya descontado el relleno de `container-width` (16px a cada lado por
 * debajo de 640, 24 hasta 1024, 32 arriba). Lo que se afirma no es cada número por separado sino la
 * forma de la escalera: nunca menos de dos, nunca más de cuatro, y **nunca hacia atrás**.
 */
describe("columnsFor", () => {
  it.each([
    { quien: "teléfono estrecho de pie", ancho: 288, columnas: 1 },
    { quien: "teléfono de pie", ancho: 328, columnas: 1 },
    { quien: "teléfono grande de pie", ancho: 398, columnas: 1 },
    { quien: "justo donde entra la segunda", ancho: 456, columnas: 2 },
    { quien: "tableta pequeña", ancho: 592, columnas: 2 },
    { quien: "tableta", ancho: 720, columnas: 3 },
    { quien: "teléfono girado", ancho: 796, columnas: 3 },
    { quien: "portátil", ancho: 960, columnas: 4 },
    { quien: "escritorio", ancho: 1216, columnas: 4 },
    { quien: "pantalla enorme", ancho: 2400, columnas: 4 },
  ])("$quien ($ancho px) reparte en $columnas", ({ ancho, columnas }) => {
    expect(columnsFor(ancho)).toBe(columnas);
  });

  /*
   * La propiedad que de verdad importa, y la que no se ve mirando la tabla de arriba: ensanchar
   * nunca quita columnas. Una frontera mal puesta produce anchos donde salen tres apretadas y al
   * agrandar la ventana vuelven a ser dos, y eso se lee como un fallo del sitio.
   */
  it("ensanchar nunca quita columnas", () => {
    let anterior = columnsFor(200);

    for (let ancho = 200; ancho <= 2400; ancho += 4) {
      const actual = columnsFor(ancho);
      expect(actual).toBeGreaterThanOrEqual(anterior);
      anterior = actual;
    }
  });

  it("y nunca se queda en cero ni pasa del tope", () => {
    for (let ancho = 120; ancho <= 4000; ancho += 8) {
      expect(columnsFor(ancho)).toBeGreaterThanOrEqual(1);
      expect(columnsFor(ancho)).toBeLessThanOrEqual(MAX_COLUMNS);
    }
  });
});

/**
 * Las dos maquetaciones tienen que medir la columna igual, o el número de columnas cambiaría al
 * hidratar y volvería el brinco. Viven en sitios distintos —una utilidad de CSS y unas constantes
 * de TypeScript— porque el CSS no puede leer un valor de JavaScript, así que lo vigila este test:
 * abre el archivo de estilos y comprueba que dice los mismos números.
 */
describe("El primer pintado y el reparto medido miden la columna igual", () => {
  const css = readFileSync("src/app/styles/globals.css", "utf8");

  it("el CSS pide columnas del mismo ancho que el reparto", () => {
    expect(css).toContain(`column-width: ${COLUMN_WIDTH}px`);
  });

  it("y el mismo tope de columnas", () => {
    expect(css).toContain(`column-count: ${MAX_COLUMNS}`);
  });

  /*
   * Y no fuerza ningún número por punto de corte. Es la propiedad que hace que un teléfono girado
   * gane columnas sin que nadie escriba una regla para él: si alguien añadiera una media query
   * aquí, el listado dejaría de leer el ancho y empezaría a adivinarlo por el dispositivo.
   */
  it("y no decide columnas por tamaño de ventana en ninguna parte", () => {
    const reglaDeColumnas = css.slice(css.indexOf("@utility card-columns"));

    expect(reglaDeColumnas).not.toMatch(/@media[^}]*column-count/);
  });

  it("y el listado sigue pidiendo la misma separación", () => {
    // La escala de espaciado de Tailwind va de 4 en 4 píxeles: `gap-4` son 16.
    expect(CARD_MASONRY).toContain(`gap-${GAP / 4}`);
  });
});
