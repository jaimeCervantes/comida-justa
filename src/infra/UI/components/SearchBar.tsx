"use client";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MdSearch } from "react-icons/md";
import type { Post } from "~/domain/entities/post/types";
import { TextField } from "~/presentation/design_system/forms/TextField";

interface SearchResult extends Post {
  id: string;
}

interface SearchBarProps {
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = "Buscar..." }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Rules: only search when length >= 3, or when user completes a word (space)
    const trimmed = query.trim();
    const lastCharIsSpace = query.endsWith(" ");
    const minLen = 3;

    const shouldSearchNow = () => {
      if (trimmed.length === 0) return false;
      if (lastCharIsSpace && trimmed.length >= 1) return true; // search by-word when user types a space
      return trimmed.length >= minLen;
    };

    if (!shouldSearchNow()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    // show the dropdown immediately so the skeleton is visible while fetching
    setShowDropdown(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const doFetch = async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
        );
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    };

    // If user just typed a space, run search immediately (word boundary), otherwise debounce
    if (lastCharIsSpace) {
      doFetch();
    } else {
      timeoutRef.current = setTimeout(doFetch, 500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  // Hide dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSeeAll = () => {
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-64" ref={wrapperRef}>
      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        type="search"
        autoComplete="off"
        icon={<MdSearch className="text-xl text-gray-400" />}
        className="rounded-full border border-gray-300 focus:border-pw-green focus:ring-2 focus:ring-pw-green bg-white dark:bg-pw-gray"
        containerClassName=""
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
            <div className="p-2 text-center text-gray-500">Sin resultados</div>
          ) : (
            <ul>
              {results.map((result, idx) => (
                <li
                  key={result.id}
                  className={`p-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-700 outline-hidden`}
                  tabIndex={0}
                  onMouseDown={() =>
                    router.push(`/${result.translations?.es.slug}`)
                  }
                >
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                    {result.translations?.es.title}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            className="w-full text-left p-3 border-t border-gray-100 dark:border-pw-gray text-pw-green hover:bg-gray-50 dark:hover:bg-pw-gray font-semibold"
            onMouseDown={handleSeeAll}
          >
            Ver todos los resultados
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
