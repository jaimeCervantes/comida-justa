"use client";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "~/i18n/navigation";
import { type OrdersParams, ordersHref } from "./ordersHref";

/**
 * Lo que se espera desde la última tecla antes de pedir la lista.
 *
 * Menos que los 500 ms de `SearchBar` a propósito: aquél va a la búsqueda semántica y pinta un
 * desplegable **encima** de lo que estás leyendo, así que equivocarse cuesta una consulta cara y un
 * parpadeo. Aquí se refiltra una lista que ya estás mirando, con un `ILIKE` sobre los pedidos de una
 * sola persona.
 */
const DEBOUNCE_MS = 300;

/** El mismo tope que aplica el servidor al leer la URL: recortar aquí evita pedir lo que se ignora. */
const MAX_TERM_LENGTH = 80;

/**
 * La búsqueda de la lista de pedidos, que filtra **mientras se escribe**.
 *
 * Era un `<form method="get">` pelado que sólo disparaba con Enter, mientras la búsqueda principal
 * del sitio filtra al teclear: dos comportamientos para el mismo gesto.
 *
 * **El formulario se queda.** Es lo que hace que Enter siga funcionando y que la pantalla sirva sin
 * JavaScript; lo que se añade encima es el disparo automático. Quitarlo habría cambiado una carencia
 * por otra.
 *
 * `replace` y no `push`: escribir "suero" son cinco cambios de dirección, y con `push` el botón de
 * atrás obliga a deshacerlos letra por letra antes de salir de la página.
 */
export default function OrdersSearchField({
  current,
}: {
  current: OrdersParams;
}) {
  const t = useTranslations("orders");
  const router = useRouter();
  const [term, setTerm] = useState(current.term);
  const [isPending, startTransition] = useTransition();
  /**
   * Lo último que **este campo** pidió.
   *
   * Distingue "el servidor contestó a lo que escribí" de "el término cambió por fuera" (el botón de
   * atrás, un enlace con `q`). Sin esta distinción, la respuesta a la tercera letra llegaría cuando
   * ya vas por la quinta y devolvería el campo atrás mientras escribes.
   */
  const requested = useRef(current.term);

  useEffect(() => {
    if (current.term === requested.current) return;

    // Vino de fuera: la caja sigue a la dirección, que es la que manda.
    requested.current = current.term;
    setTerm(current.term);
  }, [current.term]);

  useEffect(() => {
    /* Se compara ya normalizado porque el servidor normaliza al leer: sin esto, un espacio final
       dejaría `term` y `current.term` distintos para siempre y el efecto se repetiría solo. */
    const normalized = term.trim().slice(0, MAX_TERM_LENGTH);

    if (normalized === current.term) return;

    const timer = setTimeout(() => {
      requested.current = normalized;
      startTransition(() => {
        /* Sin saltar arriba: quien escribe está mirando el campo, y la lista se refresca debajo. */
        router.replace(ordersHref(current, { term: normalized, page: 1 }), {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term, current, router]);

  return (
    <form method="get" className="flex grow items-center gap-2">
      {/* Los demás filtros viajan ocultos para no perderse cuando el envío lo hace el navegador. */}
      <input type="hidden" name="vista" value={current.view} />
      {current.scope === "open" ? null : (
        <input type="hidden" name="estado" value={current.scope} />
      )}
      <input
        type="search"
        name="q"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        maxLength={MAX_TERM_LENGTH}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        /* Lo que cambia con la búsqueda es la lista, no el campo: quien escucha tiene que enterarse
           de que hay algo en camino sin que le muevan el foco. */
        aria-busy={isPending}
        data-testid="orders-search"
        className="min-w-40 grow rounded-control border border-separator bg-transparent px-3 py-1"
      />
    </form>
  );
}
