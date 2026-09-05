import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PracticeCardItem from "./PracticeCardItem";

/** Datos reales de la semilla: la descarga mental es la práctica con la evidencia más clara. */
function practice(overrides: Partial<PracticeCard> = {}): PracticeCard {
  return {
    key: "sleep-mental-unload",
    title: "La descarga mental",
    summary:
      "Escribir cinco minutos lo que queda pendiente hace dormirse antes que escribir lo que ya se hizo.",
    cue: "Justo antes de lavarte los dientes para acostarte.",
    minimum: "Tres renglones bastan.",
    effortMinutes: 5,
    costLevel: 0,
    pillars: ["sleep"],
    studyCount: 1,
    challengeKey: null,
    ...overrides,
  };
}

function card(): HTMLElement {
  return screen.getByTestId("practice-card");
}

describe("la tarjeta de una práctica", () => {
  it("enseña el ancla antes que el título: lo que la vuelve obvia es el momento", () => {
    renderWithIntl(<PracticeCardItem practice={practice()} pillar="sleep" />);

    const texto = card().textContent ?? "";
    expect(texto.indexOf("Justo antes de lavarte")).toBeLessThan(
      texto.indexOf("La descarga mental"),
    );
  });

  it("dice lo que basta para que cuente", () => {
    renderWithIntl(<PracticeCardItem practice={practice()} pillar="sleep" />);

    expect(
      within(card()).getByText(/Tres renglones bastan/),
    ).toBeInTheDocument();
  });

  it("una práctica sin estudio lo dice, en vez de callarlo", () => {
    /* Cero se enseña igual que cinco. Esconderlo dejaría creer que todas están respaldadas por
       igual, que es la autoridad prestada que este catálogo deshizo. */
    renderWithIntl(
      <PracticeCardItem
        practice={practice({ key: "sleep-paper-book", studyCount: 0 })}
        pillar="sleep"
      />,
    );

    expect(screen.getByTestId("practice-evidence")).toHaveTextContent(
      /Sin estudio/,
    );
  });

  it("anuncia los otros pilares a los que sirve", () => {
    renderWithIntl(
      <PracticeCardItem
        practice={practice({
          key: "mind-slow-breathing",
          pillars: ["mindSpirit", "sleep"],
        })}
        pillar="mindSpirit"
      />,
    );

    expect(within(card()).getByText(/También sirve a/)).toBeInTheDocument();
  });

  it("no anuncia puentes cuando la práctica sirve a un solo pilar", () => {
    renderWithIntl(<PracticeCardItem practice={practice()} pillar="sleep" />);

    expect(
      within(card()).queryByText(/También sirve a/),
    ).not.toBeInTheDocument();
  });

  it("una práctica sin ancla todavía escrita no pinta la etiqueta vacía", () => {
    renderWithIntl(
      <PracticeCardItem practice={practice({ cue: null })} pillar="sleep" />,
    );

    expect(within(card()).queryByText("Cuándo")).not.toBeInTheDocument();
  });

  it("marca la práctica que además es el ritual del pilar", () => {
    renderWithIntl(
      <PracticeCardItem
        practice={practice({ challengeKey: "sleep-evening-to-morning-v1" })}
        pillar="sleep"
      />,
    );

    expect(
      within(card()).getByText(/Es el ritual del pilar/),
    ).toBeInTheDocument();
  });
});
