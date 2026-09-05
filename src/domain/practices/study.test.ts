import { describe, expect, it } from "vitest";
import { doiUrl, type StudyCitation, studyLabel } from "./study";

function citation(overrides: Partial<StudyCitation> = {}): StudyCitation {
  return {
    doi: "10.1037/xge0000374",
    title:
      "The effects of bedtime writing on difficulty falling asleep: A polysomnographic study comparing to-do lists and completed activity lists.",
    journal: "Journal of Experimental Psychology: General",
    year: 2018,
    design: null,
    supports: ["La descarga mental"],
    ...overrides,
  };
}

describe("doiUrl", () => {
  it("resuelve el DOI contra doi.org", () => {
    expect(doiUrl("10.1037/xge0000374")).toBe(
      "https://doi.org/10.1037/xge0000374",
    );
  });

  it("no toca los DOIs con barras de más, que la lista real tiene", () => {
    // `10.36283//ziun-pjmd14-3/001` está tal cual en la bibliografía de Mente.
    expect(doiUrl("10.36283//ziun-pjmd14-3/001")).toBe(
      "https://doi.org/10.36283//ziun-pjmd14-3/001",
    );
  });
});

describe("studyLabel", () => {
  it("usa el título cuando se conoce", () => {
    expect(studyLabel(citation())).toContain("bedtime writing");
  });

  it("cae al DOI cuando el título falta, en vez de dejar la entrada muda", () => {
    expect(studyLabel(citation({ title: null }))).toBe("10.1037/xge0000374");
  });
});
