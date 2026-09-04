"use client";
import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  LIST_TERM_MAX_LENGTH,
  normalizeListTerm,
} from "~/domain/search/listTerm";
import { useRouter } from "~/i18n/navigation";

/**
 * La dirección que este campo puede pedir, **derivada del propio router**.
 *
 * `AppHref` es más ancha —admite formas que `router.replace` no acepta— y escribir el tipo a mano
 * lo dejaría desalineado el día que next-intl lo cambie. Así lo dice quien manda.
 */
type NavigationHref = Parameters<ReturnType<typeof useRouter>["replace"]>[0];

/**
 * Lo que se espera desde la última tecla antes de pedir la lista.
 *
 * Menos que los 500 ms de `SearchBar` a propósito: aquél va a la búsqueda semántica y pinta un
 * desplegable **encima** de lo que estás leyendo, así que equivocarse cuesta una consulta cara y un
 * parpadeo. Aquí se refiltra una lista que ya estás mirando, con un `ILIKE`.
 */
const DEBOUNCE_MS = 300;

export interface ListSearchLabels {
  placeholder: string;
  /** Lo que oye quien navega con lector de pantalla. */
  label: string;
}

/**
 * El buscador de una lista que ya se está mirando: filtra **mientras se escribe**.
 *
 * Nació dentro de `/pedidos` y se extrajo al llegar el tercer sitio que lo necesitaba —el panel de
 * inventario y el catálogo de una tienda—. Lo que variaba entre los tres era de dónde sale la
 * dirección y qué filtros hay que conservar; todo lo demás era idéntico, y copiarlo habría sido
 * copiar también sus cuatro decisiones difíciles:
 *
 * - **El formulario se queda.** Es lo que hace que Enter siga funcionando y que la pantalla sirva
 *   sin JavaScript; el disparo automático se añade encima. Quitarlo cambiaría una carencia por otra.
 * - **`replace` y no `push`**: escribir "suero" son cinco cambios de dirección, y con `push` el
 *   botón de atrás obliga a deshacerlos letra por letra antes de salir de la página.
 * - **Sin saltar arriba** (`scroll: false`): quien escribe está mirando el campo y la lista se
 *   refresca debajo.
 * - **Una referencia a lo último pedido**, que distingue «el servidor contestó a lo que escribí» de
 *   «el término cambió por fuera» —el botón de atrás, un enlace con `q`—. Sin ella, la respuesta a
 *   la tercera letra llega cuando ya vas por la quinta y te devuelve el campo atrás mientras
 *   escribes.
 *
 * No lee el catálogo: las frases entran ya traducidas, porque el namespace es de la lista que lo
 * monta.
 */
export default function ListSearchField({
  term: currentTerm,
  hrefForTerm,
  labels,
  hiddenFields = null,
  testId,
  className = "flex grow items-center gap-2",
}: {
  /** El término que la dirección dice ahora mismo, **ya normalizado** por quien la leyó. */
  term: string;
  hrefForTerm: (term: string) => NavigationHref;
  labels: ListSearchLabels;
  /**
   * Los demás filtros, como `<input type="hidden">`.
   *
   * Viajan ocultos para no perderse cuando el envío lo hace el navegador —sin JavaScript, el
   * `<form method="get">` manda sólo lo que hay dentro—.
   */
  hiddenFields?: ReactNode;
  testId: string;
  className?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(currentTerm);
  const [isPending, startTransition] = useTransition();
  const requested = useRef(currentTerm);

  useEffect(() => {
    if (currentTerm === requested.current) return;

    // Vino de fuera: la caja sigue a la dirección, que es la que manda.
    requested.current = currentTerm;
    setTerm(currentTerm);
  }, [currentTerm]);

  useEffect(() => {
    /* Se compara ya normalizado porque el servidor normaliza al leer: sin esto, un espacio final
       dejaría `term` y `currentTerm` distintos para siempre y el efecto se repetiría solo. */
    const normalized = normalizeListTerm(term);

    if (normalized === currentTerm) return;

    const timer = setTimeout(() => {
      requested.current = normalized;
      startTransition(() => {
        router.replace(hrefForTerm(normalized), { scroll: false });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term, currentTerm, hrefForTerm, router]);

  return (
    <form method="get" className={className}>
      {hiddenFields}
      <input
        type="search"
        name="q"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        maxLength={LIST_TERM_MAX_LENGTH}
        placeholder={labels.placeholder}
        aria-label={labels.label}
        /* Lo que cambia con la búsqueda es la lista, no el campo: quien escucha tiene que enterarse
           de que hay algo en camino sin que le muevan el foco. */
        aria-busy={isPending}
        data-testid={testId}
        className="min-w-40 grow rounded-control border border-separator bg-transparent px-3 py-1"
      />
    </form>
  );
}
