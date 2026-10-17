import { pageWindow } from "./pageWindow";

const PAGE_BUTTON =
  "focus-ring rounded-full border border-separator bg-surface-elevation-1 px-3 py-1 text-sm text-text-base transition-colors hover:bg-surface-elevation-2 disabled:opacity-50";

const PAGE_BUTTON_CURRENT =
  "focus-ring rounded-full border border-button-primary-bg bg-button-primary-bg px-3 py-1 text-sm font-semibold text-button-primary-text";

export interface PageButtonsLabels {
  /** El nombre de la navegación, ya traducido: «Páginas de resultados». */
  navigation: string;
  previous: string;
  next: string;
}

/**
 * Números de página que son **botones**, para paginar sin salir de donde se está.
 *
 * `Pagination` pagina con enlaces, y está bien para un listado: cambiar de página es cambiar de
 * dirección. Dentro de un formulario a medio llenar no: un enlace navegaría y se perdería lo
 * escrito. Aquí cada número es un `type="button"` que solo avisa a qué página ir, y quien lo usa
 * decide cómo traerla. Los números a la vista salen de la misma `pageWindow`.
 *
 * Sin textos propios: llegan ya traducidos, porque cada lista habla de lo suyo.
 */
export default function PageButtons({
  page,
  totalPages,
  onSelect,
  labels,
  disabled = false,
  testId = "page-buttons",
}: {
  page: number;
  totalPages: number;
  onSelect: (page: number) => void;
  labels: PageButtonsLabels;
  /** Mientras llega una página, para no pedir otra encima. */
  disabled?: boolean;
  testId?: string;
}) {
  const pages = pageWindow(page, totalPages);

  if (pages.length === 0) return null;

  return (
    <nav
      aria-label={labels.navigation}
      data-testid={testId}
      className="mt-3 flex flex-wrap items-center gap-2"
    >
      {page > 1 ? (
        <button
          type="button"
          className={PAGE_BUTTON}
          disabled={disabled}
          onClick={() => onSelect(page - 1)}
        >
          {labels.previous}
        </button>
      ) : null}
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          aria-current={number === page ? "page" : undefined}
          className={number === page ? PAGE_BUTTON_CURRENT : PAGE_BUTTON}
          disabled={disabled}
          onClick={() => onSelect(number)}
        >
          {number}
        </button>
      ))}
      {page < totalPages ? (
        <button
          type="button"
          className={PAGE_BUTTON}
          disabled={disabled}
          onClick={() => onSelect(page + 1)}
        >
          {labels.next}
        </button>
      ) : null}
    </nav>
  );
}
