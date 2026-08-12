import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import PillarPracticeSection, {
  type PillarPracticeCopy,
} from "./PillarPracticeSection";
import { getPillarTheme } from "./pillarThemes";

const panel = <div data-testid="tracking-panel" />;

function practiceCopy(
  overrides: Partial<PillarPracticeCopy> = {},
): PillarPracticeCopy {
  return {
    eyebrow: "Ponlo en práctica",
    title: "Del atardecer al amanecer",
    intro: "Un ritual pequeño.",
    anchors: [
      { symbol: "☾", title: "Cerrar la noche", body: "Baja la luz." },
      { symbol: "☀", title: "Abrir la mañana", body: "Sal a la luz." },
    ],
    ritual: {
      eyebrow: "Ritual recomendado",
      title: "El ritual que irá creciendo",
      body: "Cinco pasos concretos.",
      steps: ["Uno.", "Dos.", "Tres.", "Cuatro.", "Cinco."],
      safety: "Adapta la práctica a tu contexto.",
    },
    ...overrides,
  };
}

function renderPractice(
  challenge: HabitChallengeExperienceKey,
  copy: PillarPracticeCopy,
) {
  return render(
    <PillarPracticeSection
      challenge={challenge}
      copy={copy}
      theme={getPillarTheme(challenge)}
      panel={panel}
    />,
  );
}

describe.each([
  "sleep",
  "nutrition",
  "movement",
  "mind",
] as const satisfies readonly HabitChallengeExperienceKey[])(
  "the %s practice",
  (challenge) => {
    it("is a section of its page, never a second document", () => {
      const { container } = renderPractice(challenge, practiceCopy());

      expect(container.querySelector("main")).toBeNull();
      expect(
        screen.queryByRole("heading", { level: 1 }),
      ).not.toBeInTheDocument();
      const title = screen.getByRole("heading", {
        level: 2,
        name: "Del atardecer al amanecer",
      });
      expect(title.closest("section")).toHaveAttribute(
        "data-pillar",
        challenge,
      );
    });

    it("names both anclas and hands the tracking panel its place", () => {
      renderPractice(challenge, practiceCopy());

      expect(
        screen.getByRole("heading", { level: 3, name: "Cerrar la noche" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 3, name: "Abrir la mañana" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("tracking-panel")).toBeInTheDocument();
    });

    it("closes with a five-step ritual and its safety note", () => {
      renderPractice(challenge, practiceCopy());

      const ritual = screen
        .getByRole("heading", { level: 2, name: "El ritual que irá creciendo" })
        .closest("section") as HTMLElement;

      expect(within(ritual).getAllByRole("listitem")).toHaveLength(5);
      expect(within(ritual).getByText("Cinco.")).toBeInTheDocument();
      expect(
        screen.getByText("Adapta la práctica a tu contexto."),
      ).toBeInTheDocument();
    });

    /**
     * Los tres pilares que no son Sueño cerraban con un aviso de recordatorios y un botón
     * permanentemente deshabilitado. Prometía algo que la página no puede dar y era el único control
     * muerto de la práctica; que no vuelva.
     */
    it("offers no control that cannot be used", () => {
      renderPractice(challenge, practiceCopy());

      for (const button of screen.queryAllByRole("button")) {
        expect(button).toBeEnabled();
      }
    });
  },
);

describe("the optional pieces", () => {
  it("states the minimum first when the pillar spells it out", () => {
    renderPractice(
      "sleep",
      practiceCopy({
        lead: { heading: "Tu versión mínima", body: "Dos anclas bastan." },
      }),
    );

    expect(screen.getByText("Tu versión mínima")).toBeInTheDocument();
    expect(screen.getByText("Dos anclas bastan.")).toBeInTheDocument();
  });

  it("adds the preparation note as help, never as a requirement", () => {
    renderPractice(
      "nutrition",
      practiceCopy({
        note: { title: "Preparar el camino", body: "Déjalo visible." },
      }),
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Preparar el camino" }),
    ).toBeInTheDocument();
  });

  it("leaves out both when the pillar does not use them", () => {
    renderPractice("movement", practiceCopy());

    expect(screen.queryByText("Tu versión mínima")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });
});
