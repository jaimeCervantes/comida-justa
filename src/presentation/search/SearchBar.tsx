"use client";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MdSearch } from "react-icons/md";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import type { Post } from "~/domain/entities/post/types";
import { useRouter } from "~/i18n/navigation";
import { routing } from "~/i18n/routing";
import { TextField } from "~/presentation/design_system/forms/TextField";

interface SearchResult extends Post {
  id: string;
}

interface SearchBarProps {
  placeholder?: string;
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
  items: SearchResult[] | null;
};

const SearchBar: React.FC<SearchBarProps> = ({ placeholder }) => {
  const t = useTranslations("search");
  /* El repositorio de búsqueda ya indexa la traducción por su locale real, así que leer `.es` a
     secas dejaba cada resultado sin título ni slug en cuanto se buscaba en inglés. */
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<SearchOutcome>({
    forQuery: "",
    items: [],
  });
  /**
   * La consulta que el usuario descartó (clic afuera o "ver todos"). Se guarda la consulta y no un
   * booleano para que el descarte caduque solo al seguir escribiendo, sin un efecto que lo reinicie.
   */
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Todo lo que sigue se deriva de `query` y `outcome`: nada de esto necesita estado propio, y
  // calcularlo en un efecto provocaba renders en cascada.
  const trimmed = query.trim();
  const endsWithSpace = query.endsWith(" ");
  const shouldSearch =
    trimmed.length > 0 && (endsWithSpace || trimmed.length >= MIN_QUERY_LENGTH);
  /** Lo que hay en `outcome` corresponde a lo que está escrito. */
  const isSettled = outcome.forQuery === query;
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
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5&locale=${locale}`,
        );
        const data = await res.json();
        if (active) setOutcome({ forQuery: query, items: data.results || [] });
      } catch {
        if (active) setOutcome({ forQuery: query, items: null });
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
  }, [query, shouldSearch, isSettled, endsWithSpace, locale]);

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
    router.push({ pathname: "/buscar", query: { q: query } });
  };

  return (
    <div className="w-64" ref={wrapperRef}>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? t("placeholder")}
        type="search"
        autoComplete="off"
        icon={<MdSearch className="text-xl text-gray-400" />}
        shellClassName="rounded-full h-10"
        className=""
        name="search"
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-pw-gray border border-gray-200 dark:border-pw-gray rounded-sm shadow-lg z-50">
          {loading ? (
            <div className="p-2">
              <ul className="animate-pulse">
                {[1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="px-1 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700"
                  >
                    <div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-200 rounded-sm w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-200 rounded-sm w-1/2" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : results.length === 0 ? (
            <div className="p-2 text-center text-gray-500">{t("empty")}</div>
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
                    className={`p-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-700 outline-hidden`}
                    onMouseDown={() =>
                      router.push({
                        pathname: "/[slug]",
                        params: { slug: translation?.slug ?? "" },
                      })
                    }
                  >
                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                      {translation?.title}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="w-full text-left p-3 border-t border-gray-100 dark:border-pw-gray text-pw-green hover:bg-gray-50 dark:hover:bg-pw-gray font-semibold"
            onMouseDown={handleSeeAll}
          >
            {t("seeAll")}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
