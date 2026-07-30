import { describe, expect, it } from "vitest";
import { POST_ORIGINS } from "./origin";
import { buildOriginReport } from "./originReport";

describe("buildOriginReport", () => {
  it("lists every known origin plus a row for the unspecified ones", () => {
    const { rows } = buildOriginReport([]);

    expect(rows).toHaveLength(POST_ORIGINS.length + 1);
    expect(rows.map((row) => row.origin)).toEqual([...POST_ORIGINS, null]);
  });

  it("keeps origins with no products at zero", () => {
    const { rows, total } = buildOriginReport([
      { origin: "hazlo_sano_propio", count: 3 },
    ]);

    expect(rows.find((row) => row.origin === "hazlo_sano_propio")?.count).toBe(
      3,
    );
    expect(rows.find((row) => row.origin === "reventa_local")?.count).toBe(0);
    expect(total).toBe(3);
  });

  it("computes each origin's share of the total", () => {
    const { rows } = buildOriginReport([
      { origin: "hazlo_sano_propio", count: 3 },
      { origin: "hazlo_sano_reventa", count: 1 },
    ]);

    expect(rows.find((row) => row.origin === "hazlo_sano_propio")?.share).toBe(
      0.75,
    );
    expect(rows.find((row) => row.origin === "hazlo_sano_reventa")?.share).toBe(
      0.25,
    );
  });

  it("uses a share of zero when there are no products at all", () => {
    const { rows, total } = buildOriginReport([]);

    expect(total).toBe(0);
    expect(rows.every((row) => row.share === 0)).toBe(true);
  });

  it("counts products without origin in the unspecified row", () => {
    const { rows } = buildOriginReport([{ origin: null, count: 2 }]);

    expect(rows.at(-1)).toMatchObject({ origin: null, count: 2 });
  });

  it("folds unknown origins into the unspecified row instead of breaking", () => {
    const { rows, total } = buildOriginReport([
      { origin: null, count: 1 },
      { origin: "origen_viejo_fuera_de_la_allowlist", count: 2 },
    ]);

    expect(rows.at(-1)).toMatchObject({ origin: null, count: 3 });
    expect(total).toBe(3);
  });
});
