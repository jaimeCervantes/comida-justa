"use client";

import {
  Children,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Ancho mínimo de columna, el mismo que usaba la mampostería de CSS. */
const MIN_COLUMN_WIDTH = 300;

/** Separación entre tarjetas, en píxeles. Es el `gap-4` de Tailwind. */
const GAP = 16;

/**
 * Cuántas columnas caben en ese ancho. Nunca menos de una.
 *
 * En el servidor no hay ancho que medir, así que se parte de este valor y se corrige antes de
 * pintar. Ver el `useLayoutEffect` de abajo.
 */
const SERVER_COLUMNS = 3;

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

/** El reparto de partida, antes de haber medido nada. Determinista: servidor y cliente coinciden. */
function roundRobin(count: number, columnCount: number): number[] {
  return Array.from({ length: count }, (_, index) => index % columnCount);
}

function sameAssignment(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Un listado en mampostería, repartido en el cliente.
 *
 * Existe porque la multi-columna de CSS no sirve para un listado que crece: reparte de nuevo todas
 * las tarjetas al añadir, así que lo ya visto se movía. Pintarlo por tandas lo evitaba, pero dejaba
 * una costura con huecos cada nueve tarjetas. Esto da las dos cosas: flujo continuo y nada que se
 * mueva.
 *
 * **La corrección va en `useLayoutEffect` y no en `useEffect`.** El servidor no puede medir nada, así
 * que el primer HTML sale con un reparto de partida y tres columnas; `useLayoutEffect` corre después
 * de tocar el DOM y **antes de que el navegador pinte**, de modo que el reparto equivocado no llega
 * a verse. Con `useEffect` se vería un salto en cada carga.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [columnCount, setColumnCount] = useState(SERVER_COLUMNS);
  const [assignment, setAssignment] = useState<number[]>(() =>
    roundRobin(items.length, SERVER_COLUMNS),
  );

  const relayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextColumns = columnsFor(container.clientWidth);
    const heights = itemRefs.current.map(
      (node) => node?.getBoundingClientRect().height ?? 0,
    );

    /* Con alguna altura todavía en cero —una imagen que aún no ocupa su sitio— repartir daría un
       resultado que habría que deshacer en cuanto midiera de verdad, y deshacerlo es mover
       tarjetas. Se espera: el `ResizeObserver` vuelve a llamar cuando ya tengan tamaño. */
    if (heights.length !== items.length || heights.some((h) => h === 0)) {
      if (nextColumns !== columnCount) setColumnCount(nextColumns);
      return;
    }

    const next = assignToColumns(heights, nextColumns);

    if (nextColumns !== columnCount) setColumnCount(nextColumns);
    if (!sameAssignment(next, assignment)) setAssignment(next);
  }, [assignment, columnCount, items.length]);

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

  const columns = Array.from({ length: columnCount }, () => [] as number[]);
  items.forEach((_, index) => {
    columns[assignment[index] ?? index % columnCount]?.push(index);
  });

  return (
    <div
      ref={containerRef}
      className={`flex items-start gap-4 ${className}`}
      data-testid={testId}
    >
      {columns.map((indexes, column) => (
        <div
          // Las columnas no se reordenan ni se filtran: su posición ES su identidad.
          // biome-ignore lint/suspicious/noArrayIndexKey: la columna se identifica por su posición.
          key={column}
          className="flex min-w-0 flex-1 flex-col gap-4"
          data-testid="masonry-column"
        >
          {indexes.map((index) => (
            <div
              key={(items[index] as { key?: string })?.key ?? index}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
            >
              {items[index]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
