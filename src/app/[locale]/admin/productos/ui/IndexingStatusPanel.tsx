import type { IndexingReport } from "~/domain/entities/post/indexingReport";

const percentFormatter = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1,
});

/**
 * Un producto sin vector se ve perfecto en el sitio y es invisible para el chatbot. Ese hueco no
 * se nota en ninguna otra pantalla, así que aquí se nombra con todas sus letras.
 */
export default function IndexingStatusPanel({
  indexed,
  pending,
  total,
  coverage,
}: IndexingReport) {
  const allIndexed = pending === 0;

  return (
    <section
      data-testid="indexing-status"
      aria-labelledby="indexing-status-title"
    >
      <h2 id="indexing-status-title" className="text-lg font-bold mb-2">
        Indexación para el chatbot
      </h2>

      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Una publicación sin embedding no puede ser recomendada por el chatbot,
        aunque se vea bien en el sitio.
      </p>

      <dl className="flex flex-wrap gap-6 mb-4">
        <div>
          <dt className="text-sm text-gray-600 dark:text-gray-400">
            Indexadas
          </dt>
          <dd
            data-testid="indexing-count-indexed"
            className="text-2xl font-semibold tabular-nums"
          >
            {indexed}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-600 dark:text-gray-400">
            Pendientes de indexar
          </dt>
          <dd
            data-testid="indexing-count-pending"
            className="text-2xl font-semibold tabular-nums"
          >
            {pending}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-gray-600 dark:text-gray-400">
            Cobertura
          </dt>
          <dd
            data-testid="indexing-coverage"
            className="text-2xl font-semibold tabular-nums"
          >
            {percentFormatter.format(coverage)}
          </dd>
        </div>
      </dl>

      <p
        data-testid="indexing-hint"
        className="text-sm text-gray-600 dark:text-gray-400"
      >
        {allIndexed ? (
          <>Las {total} traducciones de producto están indexadas.</>
        ) : (
          <>
            Para indexar las pendientes:{" "}
            <code className="font-mono">pnpm run backfill-embeddings</code>
          </>
        )}
      </p>
    </section>
  );
}
