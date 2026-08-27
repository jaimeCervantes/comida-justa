"use client";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MdSearch } from "react-icons/md";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import type { Post } from "~/domain/entities/post/types";
import { useRouter } from "~/i18n/navigation";
import { routing } from "~/i18n/routing";
import { TextField } from "~/presentation/design_system/forms/TextField";
import {
  useSearchShortcut,
  useShortcutHint,
} from "~/presentation/search/useSearchShortcut";

interface SearchResult extends Post {
  id: string;
}

interface SearchBarProps {
  placeholder?: string;
  activePillar?: PublicationPillar | null;
}

/** Debajo de este largo no se busca, salvo que el usuario cierre una palabra con espacio. */
const MIN_QUERY_LENGTH = 3;

const DEBOUNCE_MS = 500;

/**
 * El resultado de una búsqueda, junto con la consulta que lo produjo.
 *
 * Guardar `forQuery` es lo que permite saber si lo que hay en pantalla corresponde a lo que el
 * usuario tiene escrito **sin** una bandera `loading` aparte: si no coinciden, hay una petición en
 * vuelo. `items: null` significa que la petición falló.
 */
type SearchOutcome = {
  forQuery: string;
  forPillar: PublicationPillar | null;
  items: SearchResult[] | null;
};

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  activePillar = null,
}) => {
  const t = useTranslations("search");
  /* El repositorio de búsqueda ya indexa la traducción por su locale real, así que leer `.es` a
     secas dejaba cada resultado sin título ni slug en cuanto se buscaba en inglés. */
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<SearchOutcome>({
    forQuery: "",
    forPillar: null,
    items: [],
  });
  /**
   * La consulta que el usuario descartó (clic afuera o "ver todos"). Se guarda la consulta y no un
   * booleano para que el descarte caduque solo al seguir escribiendo, sin un efecto que lo reinicie.
   */
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const router = useRouter();
  const wrapperRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useSearchShortcut(inputRef);
  const shortcutHint = useShortcutHint();

  // Todo lo que sigue se deriva de `query` y `outcome`: nada de esto necesita estado propio, y
  // calcularlo en un efecto provocaba renders en cascada.
  const trimmed = query.trim();
  const endsWithSpace = query.endsWith(" ");
  const shouldSearch =
    trimmed.length > 0 && (endsWithSpace || trimmed.length >= MIN_QUERY_LENGTH);
  /** Lo que hay en `outcome` corresponde a lo que está escrito. */
  const isSettled =
    outcome.forQuery === query && outcome.forPillar === activePillar;
  const loading = shouldSearch && !isSettled;
  const failed = isSettled && outcome.items === null;
  const results = isSettled && outcome.items ? outcome.items : [];
  // Un fallo esconde el desplegable, igual que antes: no se le muestra "Sin resultados" a alguien
  // cuya búsqueda nunca llegó a ejecutarse.
  const showDropdown = shouldSearch && dismissedFor !== query && !failed;

  useEffect(() => {
    if (!shouldSearch || isSettled) return;

    let active = true;

    const doFetch = async () => {
      try {
        /* El idioma viaja en la petición: sin él la ruta caía a español y el desplegable buscaba
           en español aunque el sitio estuviera en inglés. Se arregló leer la traducción correcta al
           pintar (ver arriba) y se quedó sin arreglar el pedirla. */
        const params = new URLSearchParams({
          q: query,
          limit: "5",
          locale,
        });
        if (activePillar) {
          params.set(PUBLICATION_PILLAR_QUERY_PARAM, activePillar);
        }
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        if (active) {
          setOutcome({
            forQuery: query,
            forPillar: activePillar,
            items: data.results || [],
          });
        }
      } catch {
        if (active) {
          setOutcome({ forQuery: query, forPillar: activePillar, items: null });
        }
      }
    };

    // Cerrar una palabra con espacio es una señal deliberada: se busca ya, sin esperar el debounce.
    if (endsWithSpace) {
      doFetch();
      return () => {
        active = false;
      };
    }

    const timer = setTimeout(doFetch, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, shouldSearch, isSettled, endsWithSpace, locale, activePillar]);

  // Hide dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setDismissedFor(query);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  const handleSeeAll = () => {
    setDismissedFor(query);
    /* La ruta se nombra por su clave interna (`/buscar`); cuál se ve —`/buscar` o `/search`— lo
       resuelve `pathnames` según el idioma. El término va en `query`, así que ya no hace falta
       escaparlo a mano. */
    router.push({
      pathname: "/buscar",
      query: activePillar
        ? { q: query, [PUBLICATION_PILLAR_QUERY_PARAM]: activePillar }
        : { q: query },
    });
  };

  /**
   * Enter en un teclado físico y el botón «Buscar»/«Ir» del teclado del teléfono disparan el mismo
   * evento `submit` de un `<input type="search">` dentro de un `<form>` — es la forma nativa de
   * cazar los dos con un solo manejador, en vez de escuchar `keydown` y perderse el teclado móvil,
   * que no siempre emite una tecla interceptable.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    handleSeeAll();
  };

  return (
    <form className="w-64" ref={wrapperRef} onSubmit={handleSubmit}>
      <TextField
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? t("placeholder")}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        icon={<MdSearch className="text-xl text-text-muted" />}
        /* La tecla, como en el 5.1. `aria-hidden` porque es una pista para quien tiene teclado —el
           atajo funciona igual sin leerla— y anunciarla en cada campo alargaría su nombre accesible
           sin decir nada nuevo. Se esconde en pantallas estrechas: ahí no hay teclado que pulsar. */
        iconEnd={
          shortcutHint ? (
            <kbd
              aria-hidden
              data-testid="search-shortcut"
              className="hidden rounded-chip border border-separator px-1.5 py-0.5 font-mono text-tiny text-text-muted md:inline-block"
            >
              {shortcutHint}
            </kbd>
          ) : null
        }
        shellClassName="rounded-full h-10"
        className=""
        name="search"
      />
      {showDropdown && (
        <div
          className="absolute left-0 right-0 mt-1 bg-surface-elevation-1 border border-separator rounded-control shadow-lg z-50"
          data-testid="search-dropdown"
        >
          {loading ? (
            <div className="p-2">
              <ul className="animate-pulse">
                {[1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="px-1 py-3 border-b last:border-b-0 border-separator"
                  >
                    <div>
                      <div className="h-3 bg-surface-elevation-2 rounded-chip w-3/4 mb-2" />
                      <div className="h-2 bg-surface-elevation-2 rounded-chip w-1/2" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <div className="p-2 text-center text-text-support">
              {t("empty")}
            </div>
          ) : (
            <ul>
              {results.map((result) => {
                const translation = resolvePostTranslation(
                  result.translations,
                  locale,
                  routing.defaultLocale,
                );
                return (
                  <li
                    key={result.id}
                    className={`p-3 border-b last:border-b-0 border-separator cursor-pointer transition-colors hover:bg-surface-elevation-2 focus:bg-surface-elevation-2 outline-hidden`}
                    onMouseDown={() =>
                      router.push({
                        pathname: "/[slug]",
                        params: { slug: translation?.slug ?? "" },
                      })
                    }
                  >
                    <div className="font-bold text-text-base text-sm">
                      {translation?.title}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="w-full text-left p-3 border-t border-separator text-highlight hover:bg-surface-elevation-2 font-semibold"
            onMouseDown={handleSeeAll}
          >
            {t("seeAll")}
          </button>
        </div>
      )}
    </form>
  );
};

export default SearchBar;
