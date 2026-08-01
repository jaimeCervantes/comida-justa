import { describe, expect, it } from "vitest";
import { buildIndexingReport } from "~/domain/entities/post/indexingReport";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import IndexingStatusPanel from "./IndexingStatusPanel";

describe("When the indexing status is rendered", () => {
  // Criterio "El panel admin muestra cuántas publicaciones están pendientes de indexar".
  it("shows how many products the chatbot cannot see yet", () => {
    const report = buildIndexingReport({ indexed: 9, pending: 4 });

    const { getByTestId } = render(<IndexingStatusPanel {...report} />);

    expect(getByTestId("indexing-count-indexed")).toHaveTextContent("9");
    expect(getByTestId("indexing-count-pending")).toHaveTextContent("4");
    expect(getByTestId("indexing-coverage")).toHaveTextContent("69.2%");
  });

  it("points at the backfill command while something is pending", () => {
    const report = buildIndexingReport({ indexed: 9, pending: 4 });

    const { getByTestId } = render(<IndexingStatusPanel {...report} />);

    expect(getByTestId("indexing-hint")).toHaveTextContent(
      "pnpm run backfill-embeddings",
    );
  });

  it("stops nagging once every translation has its vector", () => {
    const report = buildIndexingReport({ indexed: 13, pending: 0 });

    const { getByTestId } = render(<IndexingStatusPanel {...report} />);

    expect(getByTestId("indexing-count-pending")).toHaveTextContent("0");
    expect(getByTestId("indexing-coverage")).toHaveTextContent("100%");
    expect(getByTestId("indexing-hint")).toHaveTextContent(
      "Las 13 traducciones de producto están indexadas.",
    );
  });
});
