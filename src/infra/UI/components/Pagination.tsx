import { useTranslations } from "next-intl";
import { type AppHref, Link, type PaginatedPathname } from "~/i18n/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /**
   * La ruta que pagina, declarada en `routing.ts`: `"/page/[page]"`,
   * `"/productos/page/[page]"`, `"/tienda/[slug]/page/[page]"`…
   *
   * Antes era un `basePath: string` que se concatenaba a mano (`` `${basePath}/${n}` ``). Eso no
   * sobrevive a las rutas localizadas —la dirección visible cambia con el idioma, así que no se
   * puede armar con un template— y además dejaba pasar destinos inventados: `/buscar` paginaba
   * hacia `/search`, una ruta distinta, y nadie se enteró.
   */
  pathname: PaginatedPathname;
  /** Los segmentos que la ruta necesita **además** de `page`: `slug`, `term`, `username`. */
  params?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  pathname,
  params,
}: PaginationProps) {
  const t = useTranslations("feed");
  if (totalPages <= 1) return null;

  // Calculate page range (max 5 pages, centered)
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  /* El cast es la única costura: TypeScript no puede comprobar que estos `params` son los que pide
     *esta* ruta concreta, porque `pathname` llega como unión. Lo que sí queda garantizado por el
     tipo es lo que importaba: que la ruta exista y que sea una que pagina. */
  const hrefForPage = (page: number): AppHref =>
    ({
      pathname,
      params: { ...params, page: String(page) },
    }) as AppHref;

  return (
    <nav
      aria-label={t("paginationLabel")}
      className="flex justify-center mt-8 space-x-4"
    >
      {currentPage > 1 && (
        <Link
          href={hrefForPage(currentPage - 1)}
          className="px-4 py-2 border rounded-full bg-white dark:text-black hover:bg-gray-300"
        >
          {t("previousPage")}
        </Link>
      )}
      <div className="flex space-x-2">
        {pages.map((pageNum) => (
          <Link
            key={`page-link-${pageNum}`}
            href={hrefForPage(pageNum)}
            className={`px-4 py-2 border rounded-full ${
              pageNum === currentPage
                ? "bg-pw-lightgreen text-white"
                : "bg-white dark:text-black hover:bg-gray-300"
            }`}
          >
            {pageNum}
          </Link>
        ))}
      </div>
      {currentPage < totalPages && (
        <Link
          href={hrefForPage(currentPage + 1)}
          className="px-4 py-2 border rounded-full bg-white dark:text-black hover:bg-gray-300"
        >
          {t("nextPage")}
        </Link>
      )}
    </nav>
  );
}
