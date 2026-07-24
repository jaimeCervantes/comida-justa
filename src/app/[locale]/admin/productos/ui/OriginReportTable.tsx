import type { OriginReport } from "~/domain/entities/post/originReport";
import { originLabel } from "~/infra/UI/labels/postOriginLabels";

const percentFormatter = new Intl.NumberFormat("es-MX", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Identificador estable de cada fila, también para la fila sin `origin`. */
function rowKey(origin: string | null): string {
  return origin ?? "sin_especificar";
}

export default function OriginReportTable({ rows, total }: OriginReport) {
  return (
    <div className="overflow-x-auto">
      <table
        data-testid="origin-report"
        className="w-full text-left border-collapse"
      >
        <caption className="sr-only">
          Productos publicados agrupados por procedencia
        </caption>
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th scope="col" className="py-2 pr-4 font-semibold">
              Procedencia
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold text-right">
              Productos
            </th>
            <th scope="col" className="py-2 font-semibold text-right">
              Participación
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row.origin)}
              className="border-b border-gray-100 dark:border-gray-900"
            >
              <th scope="row" className="py-2 pr-4 font-normal">
                {originLabel(row.origin)}
              </th>
              <td
                data-testid={`origin-count-${rowKey(row.origin)}`}
                className="py-2 pr-4 text-right tabular-nums"
              >
                {row.count}
              </td>
              <td className="py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                {percentFormatter.format(row.share)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <th scope="row" className="py-2 pr-4 text-left">
              Total
            </th>
            <td
              data-testid="origin-count-total"
              className="py-2 pr-4 text-right tabular-nums"
            >
              {total}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
