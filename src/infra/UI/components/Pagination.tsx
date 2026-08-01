import { Link } from "~/i18n/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/page" or "/search/{term}/page"
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate page range (max 5 pages, centered)
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Paginación" className="flex justify-center mt-8 space-x-4">
      {currentPage > 1 && (
        <Link
          href={`${basePath}/${currentPage - 1}`}
          className="px-4 py-2 border rounded-full bg-white dark:text-black hover:bg-gray-300"
        >
          Anterior
        </Link>
      )}
      <div className="flex space-x-2">
        {pages.map((pageNum) => (
          <Link
            key={`page-link-${pageNum}`}
            href={`${basePath}/${pageNum}`}
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
          href={`${basePath}/${currentPage + 1}`}
          className="px-4 py-2 border rounded-full bg-white dark:text-black hover:bg-gray-300"
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
