"use client";
import React, { useState, useRef, useEffect } from "react";
import TextField from "./TextField/TextField";
import { useRouter } from "next/navigation";
import { MdSearch } from "react-icons/md";

interface SearchResult {
  id: string;
  title: string;
  description: string;
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
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`
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
    }, 300);
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
        <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-pw-gray border border-gray-200 dark:border-pw-gray rounded shadow-lg z-50">
          {loading ? (
            <div className="p-2 text-center text-gray-500">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-center text-gray-500">Sin resultados</div>
          ) : (
            <ul>
              {results.map((result, idx) => (
                <li
                  key={result.id}
                  className={`p-2 border-b last:border-b-0 border-gray-200 dark:border-pw-gray cursor-pointer transition-colors hover:bg-pw-lightgreen/20 focus:bg-pw-lightgreen/30 outline-none`}
                  tabIndex={0}
                  onMouseDown={() => router.push(`/post/${result.id}`)}
                >
                  <div className="font-semibold">{result.title}</div>
                  <div className="text-xs text-gray-500">
                    {result.description}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button
            className="w-full text-left p-2 border-t border-gray-100 dark:border-pw-gray text-pw-green hover:bg-gray-50 dark:hover:bg-pw-gray font-semibold"
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
