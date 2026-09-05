import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StudyCitation } from "~/domain/practices/study";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PillarReferences from "./PillarReferences";

/**
 * Los datos son los reales de la base: los tres estudios del descanso cuyo vínculo con una práctica
 * vivía hasta ahora como comentario en `references.ts`, y uno de los treinta que no sostienen
 * ninguna acción concreta.
 */
function citation(overrides: Partial<StudyCitation> = {}): StudyCitation {
  return {
    doi: "10.1210/jc.2010-2098",
    title:
      "Exposure to Room Light before Bedtime Suppresses Melatonin Onset and Shortens Melatonin Duration in Humans",
    journal: "The Journal of Clinical Endocrinology & Metabolism",
    year: 2011,
    design: null,
    supports: ["Atenuar la casa una hora antes"],
    ...overrides,
  };
}

/** La entrada completa de un estudio, buscada por lo que el enlace enseña. */
function entryNamed(name: RegExp): HTMLElement {
  const entry = screen.getByRole("link", { name }).closest("li");
  if (!entry) throw new Error(`«${name}» no vive dentro de una entrada`);
  return entry;
}

describe("la bibliografía de un pilar", () => {
  it("enseña el estudio por su nombre, no por su URL", () => {
    renderWithIntl(<PillarReferences pillar="sleep" studies={[citation()]} />);

    const link = screen.getByRole("link", { name: /Room Light/ });
    expect(link).toHaveAttribute(
      "href",
      "https://doi.org/10.1210/jc.2010-2098",
    );
    expect(link).not.toHaveTextContent("https://doi.org/");
  });

  it("dice de qué revista y de qué año es", () => {
    renderWithIntl(<PillarReferences pillar="sleep" studies={[citation()]} />);

    expect(
      within(entryNamed(/Room Light/)).getByText(
        /Journal of Clinical Endocrinology.*2011/,
      ),
    ).toBeInTheDocument();
  });

  it("declara qué práctica sostiene el estudio", () => {
    renderWithIntl(<PillarReferences pillar="sleep" studies={[citation()]} />);

    expect(
      within(entryNamed(/Room Light/)).getByText(
        /Atenuar la casa una hora antes/,
      ),
    ).toBeInTheDocument();
  });

  it("nombra el diseño cuando el propio artículo se llama así", () => {
    renderWithIntl(
      <PillarReferences
        pillar="mindSpirit"
        studies={[
          citation({
            doi: "10.1177/1745691614568352",
            title:
              "Loneliness and Social Isolation as Risk Factors for Mortality",
            journal: "Perspectives on Psychological Science",
            year: 2015,
            design: "meta_analysis",
            supports: [],
          }),
        ]}
      />,
    );

    expect(screen.getByText(/metaanálisis/)).toBeInTheDocument();
  });

  it("mantiene el estudio que no sostiene ninguna práctica, sin inventarle una", () => {
    renderWithIntl(
      <PillarReferences
        pillar="sleep"
        studies={[
          citation({
            doi: "10.5664/jcsm.9476",
            title:
              "Sleep is essential to health: an American Academy of Sleep Medicine position statement",
            journal: "Journal of Clinical Sleep Medicine",
            year: 2021,
            design: "guideline",
            supports: [],
          }),
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: /essential to health/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sostiene:/)).not.toBeInTheDocument();
  });

  it("cae al DOI cuando Crossref no supo el título, sin perder el enlace", () => {
    // `10.36283//ziun-pjmd14-3/001` está tal cual en la bibliografía de Mente.
    renderWithIntl(
      <PillarReferences
        pillar="mindSpirit"
        studies={[
          citation({
            doi: "10.36283//ziun-pjmd14-3/001",
            title: null,
            journal: null,
            year: null,
            supports: [],
          }),
        ]}
      />,
    );

    const link = screen.getByRole("link", {
      name: "10.36283//ziun-pjmd14-3/001",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://doi.org/10.36283//ziun-pjmd14-3/001",
    );
  });

  it("no dibuja la sección cuando el pilar todavía no tiene bibliografía sembrada", () => {
    const { container } = renderWithIntl(
      <PillarReferences pillar="movement" studies={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
