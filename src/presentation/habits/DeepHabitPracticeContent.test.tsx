import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import DeepHabitPracticeContent from "./DeepHabitPracticeContent";
import type { DeepHabitChallengeCopy } from "./deepHabitChallengeCopy";
import { getDeepHabitChallengeTheme } from "./deepHabitChallengeThemes";
import type { HabitChallengeAction } from "./HabitChallengePanel";

const action: HabitChallengeAction = async (state) => state;

describe.each([
  {
    challenge: "nutrition" as const,
    title: "Una planta más",
    cue: "Elegir mi comida ancla",
    minimum: "Sumar una planta",
    preparation: "Preparar el camino, no aprobar un examen",
    ritual: "Elegir, preparar, sumar y notar",
    steps: [
      "Elegir la comida ancla.",
      "Hacer visible una opción vegetal.",
      "Lavarla o porcionarla cuando ayude.",
      "Sumarla a la comida elegida.",
      "Notar qué combinación resultó fácil.",
    ],
  },
  {
    challenge: "movement" as const,
    title: "Dos minutos cuentan",
    cue: "Elegir una señal de inicio",
    minimum: "Moverme dos minutos",
    preparation: "Preparar una salida fácil",
    ritual: "Preparar, empezar, moverse y notar",
    steps: [
      "Preparar la señal elegida.",
      "Ponerse de pie o iniciar según capacidad.",
      "Moverse durante dos minutos.",
      "Notar cómo se siente el cuerpo.",
      "Decidir libremente si continuar o cerrar.",
    ],
  },
  {
    challenge: "mind" as const,
    title: "Un vínculo consciente",
    cue: "Pausar fuera del ruido digital",
    minimum: "Enviar presencia y dejar espacio",
    preparation: "Elegir sin exigir",
    ritual: "Pausar, elegir, contactar, escuchar y agradecer",
    steps: [
      "Pausar lejos del ruido digital.",
      "Elegir una persona con intención.",
      "Contactar con un mensaje genuino.",
      "Dejar espacio para escuchar o responder.",
      "Agradecer el vínculo sin exigir reacción.",
    ],
  },
])(
  "$title",
  ({ challenge, title, cue, minimum, preparation, ritual, steps }) => {
    it("renders a specific five-step ritual as an embedded section", () => {
      const copy = challengeCopy({
        title,
        cueTitle: cue,
        minimumTitle: minimum,
        preparationTitle: preparation,
        ritualTitle: ritual,
        ritualSteps: steps,
      });
      const { container } = renderWithIntl(
        <DeepHabitPracticeContent
          action={action}
          challenge={challenge}
          copy={copy}
          progress={null}
          signedIn
          signInHref="/auth/signin"
          theme={getDeepHabitChallengeTheme(challenge)}
        />,
      );

      expect(container.querySelector("main")).toBeNull();
      expect(
        screen.queryByRole("heading", { level: 1 }),
      ).not.toBeInTheDocument();
      const practiceTitle = screen.getByRole("heading", {
        level: 2,
        name: title,
      });
      const practice = practiceTitle.closest("section");
      expect(practice).toHaveAttribute("data-pillar", challenge);
      expect(
        within(practice as HTMLElement).getByRole("heading", {
          level: 3,
          name: cue,
        }),
      ).toBeInTheDocument();
      expect(
        within(practice as HTMLElement).getByRole("heading", {
          level: 3,
          name: minimum,
        }),
      ).toBeInTheDocument();
      expect(
        within(practice as HTMLElement).getByRole("heading", {
          level: 3,
          name: preparation,
        }),
      ).toBeInTheDocument();

      const ritualSection = screen
        .getByRole("heading", { level: 2, name: ritual })
        .closest("section");
      expect(
        within(ritualSection as HTMLElement).getAllByRole("listitem"),
      ).toHaveLength(5);
      expect(
        within(ritualSection as HTMLElement).getByText(steps[4]),
      ).toBeInTheDocument();
    });
  },
);

function challengeCopy(
  overrides: Partial<DeepHabitChallengeCopy> &
    Pick<
      DeepHabitChallengeCopy,
      | "title"
      | "cueTitle"
      | "minimumTitle"
      | "preparationTitle"
      | "ritualTitle"
      | "ritualSteps"
    >,
): DeepHabitChallengeCopy {
  return {
    cueBody: "Señal específica.",
    eyebrow: "Práctica concreta",
    identity: "Identidad específica",
    intro: "Introducción específica.",
    minimumBody: "Mínimo específico.",
    preparationBody: "Preparación específica.",
    reminderDisabled: "Próximamente",
    reminderTitle: "Recordatorios",
    reminderUnavailable: "Todavía no disponible.",
    ritualBody: "Cinco pasos concretos.",
    safety: "Adapta la práctica a tu contexto.",
    ...overrides,
  };
}
