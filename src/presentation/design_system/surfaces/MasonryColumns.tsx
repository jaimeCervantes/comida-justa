"use client";

import {
  Children,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CARD_MASONRY } from "./cardList";

/**
 * Ancho mínimo de columna.
 *
 * **Tiene que ser el mismo número que el `columns-[300px]` de `CARD_MASONRY`**, que es quien
 * maqueta mientras no hay nada medido: si los dos lados se separan, el número de columnas cambiaría
 * al hidratar y volvería el brinco. Tailwind no puede leer esta constante —sus clases se extraen
 * del código fuente—, así que hay un test que vigila que sigan diciendo lo mismo.
 */
export const MIN_COLUMN_WIDTH = 300;

/** Separación entre tarjetas, en píxeles. Es el `gap-4` de Tailwind. */
export const GAP = 16;

function columnsFor(width: number): number {
  return Math.max(1, Math.floor((width + GAP) / (MIN_COLUMN_WIDTH + GAP)));
}

/**
 * **Reparto voraz, en orden: cada tarjeta va a la columna más corta hasta ese momento.**
 *
 * La propiedad que importa no es que equilibre —eso se ve—, es que **es estable al añadir**:
 * recorrer en orden significa que colocar la número 10 no puede cambiar dónde quedaron las nueve
 * anteriores, porque su decisión ya estaba tomada cuando solo existían ellas. Por eso se puede
 * recalcular entero en cada render sin que nada salte, y por eso cargar más no mueve lo que ya se
 * estaba viendo — que fue el fallo que trajo aquí.
 *
 * Es lo que la multi-columna de CSS no puede dar: `column-fill: balance` reparte de nuevo TODAS
 * las tarjetas cada vez que llega una, y no sabe hacerlo de otro modo.
 */
export function assignToColumns(
  heights: readonly number[],
  columnCount: number,
): number[] {
  const totals = new Array<number>(columnCount).fill(0);

  return heights.map((height) => {
    let shortest = 0;
    for (let column = 1; column < columnCount; column++) {
      if (totals[column] < totals[shortest]) shortest = column;
    }

    totals[shortest] += height + GAP;

    return shortest;
  });
}

function sameAssignment(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** Un reparto ya medido. Mientras es `null`, quien maqueta es CSS. */
type Layout = {
  readonly columns: number;
  readonly assignment: readonly number[];
};

/**
 * Un listado en mampostería que se reparte en el cliente **sin decidir nada hasta poder medir**.
 *
 * Existe porque la multi-columna de CSS no sirve para un listado que crece: reparte de nuevo todas
 * las tarjetas al añadir, así que lo ya visto se movía. Pintarlo por tandas lo evitaba, pero dejaba
 * una costura con huecos cada nueve tarjetas. El reparto voraz de arriba da las dos cosas: flujo
 * continuo y nada que se mueva.
 *
 * **Antes de medir, maqueta CSS, y eso no es un detalle.** El servidor no tiene ancho que medir, y
 * durante un tiempo esto arrancaba en tres columnas fijas confiando en que `useLayoutEffect` las
 * corrigiera antes de pintar. Solo que `useLayoutEffect` corre **después de la hidratación**: el
 * primer pintado es el HTML del servidor, que el teléfono dibuja en cuanto llega y mucho antes de
 * que baje el JavaScript. Resultado, el fallo reportado: el home abría con tres columnas apretadas
 * y de golpe se convertía en una. Ahora el primer render sale con `CARD_MASONRY` —la misma
 * multi-columna que usan los demás listados—, que el navegador resuelve solo, con el ancho real y
 * sin scripts. `columns-[300px] gap-4` y `columnsFor()` son la misma fórmula sobre los mismos
 * números, así que el número de columnas no cambia al hidratar; lo único que se acomoda al medir es
 * en qué columna cae cada tarjeta.
 *
 * Y cuando solo cabe una columna —el teléfono— ni eso: CSS ya pone las tarjetas en orden, una
 * debajo de otra, que es exactamente lo que haría el reparto, así que no se toca el DOM.
 */
export default function MasonryColumns({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  const items = Children.toArray(children);
  const count = items.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [layout, setLayout] = useState<Layout | null>(null);

  const relayout = useCallback(() => {
    const container = containerRef.current;
    if (!container || count === 0) return;

    const columns = columnsFor(container.clientWidth);

    if (columns === 1) {
      if (layout) setLayout(null);
      return;
    }

    const heights = Array.from(
      { length: count },
      (_, index) =>
        itemRefs.current[index]?.getBoundingClientRect().height ?? 0,
    );

    /* Con alguna altura todavía en cero —una imagen que aún no ocupa su sitio— repartir daría un
       resultado que habría que deshacer en cuanto midiera de verdad, y deshacerlo es mover
       tarjetas. Se espera, maquetando con CSS: el `ResizeObserver` vuelve a llamar cuando tengan
       tamaño. */
    if (heights.some((height) => height === 0)) return;

    const assignment = assignToColumns(heights, columns);

    if (
      layout &&
      layout.columns === columns &&
      sameAssignment(layout.assignment, assignment)
    ) {
      return;
    }

    setLayout({ columns, assignment });
  }, [count, layout]);

  useLayoutEffect(() => {
    relayout();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    /* Observa el contenedor y cada tarjeta: el ancho cambia al girar el teléfono, y el alto cambia
       cuando una imagen termina de cargar. Las dos cosas invalidan el reparto. */
    const observer = new ResizeObserver(relayout);
    observer.observe(container);
    for (const node of itemRefs.current) {
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [relayout]);

  /* El envoltorio es el mismo en las dos maquetaciones: es lo que se mide, y en la de CSS es
     también lo que no debe partirse entre columnas (`CARD_MASONRY` estiliza a sus hijos directos). */
  const wrapped = (index: number) => (
    <div
      key={(items[index] as { key?: string })?.key ?? index}
      ref={(node) => {
        itemRefs.current[index] = node;
      }}
    >
      {items[index]}
    </div>
  );

  if (!layout) {
    return (
      <div
        ref={containerRef}
        className={`${CARD_MASONRY} ${className}`}
        data-testid={testId}
      >
        {items.map((_, index) => wrapped(index))}
      </div>
    );
  }

  const buckets = Array.from({ length: layout.columns }, () => [] as number[]);
  items.forEach((_, index) => {
    /* Una tarjeta recién llegada todavía no está en el reparto: se le da un sitio provisional para
       que el render no se caiga. Dura lo que tarda el `useLayoutEffect` de arriba, que corre antes
       de pintar, así que nadie lo ve. */
    buckets[layout.assignment[index] ?? index % layout.columns]?.push(index);
  });

  return (
    <div
      ref={containerRef}
      className={`flex items-start gap-4 ${className}`}
      data-testid={testId}
    >
      {buckets.map((indexes, column) => (
        <div
          // Las columnas no se reordenan ni se filtran: su posición ES su identidad.
          // biome-ignore lint/suspicious/noArrayIndexKey: la columna se identifica por su posición.
          key={column}
          className="flex min-w-0 flex-1 flex-col gap-4"
          data-testid="masonry-column"
        >
          {indexes.map((index) => wrapped(index))}
        </div>
      ))}
    </div>
  );
}
