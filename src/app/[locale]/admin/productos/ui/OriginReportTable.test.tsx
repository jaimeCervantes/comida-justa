import { describe, expect, it } from "vitest";
import { buildOriginReport } from "~/domain/entities/post/originReport";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import OriginReportTable from "./OriginReportTable";

describe("When the origin report is rendered", () => {
  it("shows a row per origin with its count, including the ones at zero", () => {
    const report = buildOriginReport([
      { origin: "hazlo_sano_propio", count: 3 },
      { origin: "hazlo_sano_reventa", count: 1 },
    ]);

    const { getByTestId, getByText } = render(
      <OriginReportTable {...report} />,
    );

    expect(getByTestId("origin-count-hazlo_sano_propio")).toHaveTextContent(
      "3",
    );
    expect(getByTestId("origin-count-hazlo_sano_reventa")).toHaveTextContent(
      "1",
    );
    expect(getByTestId("origin-count-reventa_local")).toHaveTextContent("0");
    expect(getByTestId("origin-count-total")).toHaveTextContent("4");
    expect(getByText("Hazlo Sano — propio")).toBeInTheDocument();
  });

  it("labels the products with no origin as unspecified", () => {
    const report = buildOriginReport([{ origin: null, count: 2 }]);

    const { getByTestId, getByText } = render(
      <OriginReportTable {...report} />,
    );

    expect(getByTestId("origin-count-sin_especificar")).toHaveTextContent("2");
    expect(getByText("Sin especificar")).toBeInTheDocument();
  });

  it("shows each origin's share of the total", () => {
    const report = buildOriginReport([
      { origin: "hazlo_sano_propio", count: 3 },
      { origin: "productor_local", count: 1 },
    ]);

    const { getByText } = render(<OriginReportTable {...report} />);

    expect(getByText("75%")).toBeInTheDocument();
    expect(getByText("25%")).toBeInTheDocument();
  });
});
