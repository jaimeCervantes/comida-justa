import { describe, expect, it } from "vitest";
import { buildIndexingReport } from "./indexingReport";

describe("buildIndexingReport", () => {
  describe.each([
    ["everything indexed", { indexed: 13, pending: 0 }, 13, 0, 13, 1],
    [
      "the state slice 3 left behind",
      { indexed: 9, pending: 4 },
      9,
      4,
      13,
      9 / 13,
    ],
    ["nothing indexed yet", { indexed: 0, pending: 4 }, 0, 4, 4, 0],
    [
      "an empty catalog is not 'uncovered'",
      { indexed: 0, pending: 0 },
      0,
      0,
      0,
      1,
    ],
  ])("%s", (_case, counts, indexed, pending, total, coverage) => {
    it(`reports ${indexed}/${total}`, () => {
      expect(buildIndexingReport(counts)).toEqual({
        indexed,
        pending,
        total,
        coverage,
      });
    });
  });

  it("never reports a negative count", () => {
    expect(buildIndexingReport({ indexed: -1, pending: -5 })).toEqual({
      indexed: 0,
      pending: 0,
      total: 0,
      coverage: 1,
    });
  });
});
