import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import type { CommunitySectionVariant } from "./communitySectionVariant";
import PublicHabitCelebrationList from "./PublicHabitCelebrationList";

vi.mock("./PublicHabitCelebrationCard", () => ({
  default: ({
    celebration,
    headingLevel,
    variant,
  }: {
    celebration: PublicHabitCelebration;
    headingLevel: 2 | 3;
    variant?: CommunitySectionVariant;
  }) => (
    <article data-testid="celebration-card" data-variant={variant}>
      <span>{celebration.id}</span>
      <span>{headingLevel}</span>
    </article>
  ),
}));

/* La puerta la arma la página que enseña la lista —es quien sabe el idioma—; aquí solo viaja. */
const PUERTA = "/auth/signin?callbackUrl=%2Fpilares";

describe("PublicHabitCelebrationList", () => {
  it("renders every celebration in query order as a card within one section", () => {
    render(
      <PublicHabitCelebrationList
        title="Celebraciones de la comunidad"
        celebrations={[
          celebration("nutrition-latest", "nutrition-one-plant-v1"),
          celebration("sleep-previous", "sleep-evening-to-morning-v1"),
        ]}
        viewerSignedIn
        signInHref={PUERTA}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Celebraciones de la comunidad" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId("celebration-card").map((card) => card.textContent),
    ).toEqual(["nutrition-latest3", "sleep-previous3"]);
  });

  it("hands its own variant to every card, so the row shrinks as one", () => {
    render(
      <PublicHabitCelebrationList
        title="Celebraciones de la comunidad"
        celebrations={[
          celebration("nutrition-latest", "nutrition-one-plant-v1"),
        ]}
        viewerSignedIn
        signInHref={PUERTA}
        variant="compact"
      />,
    );

    expect(screen.getByTestId("celebration-card")).toHaveAttribute(
      "data-variant",
      "compact",
    );
  });

  it("does not render an empty community section", () => {
    const { container } = render(
      <PublicHabitCelebrationList
        title="Celebraciones de la comunidad"
        celebrations={[]}
        viewerSignedIn={false}
        signInHref={PUERTA}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

function celebration(
  id: string,
  challengeKey: PublicHabitCelebration["challengeKey"],
): PublicHabitCelebration {
  return {
    id,
    challengeKey,
    displayName: "Healthy Food",
    username: "healthy-food",
    image: null,
    publishedAt: new Date("2026-08-11T12:00:00Z"),
    milestone: "first_cycle",
    reactionCount: 0,
    viewerReacted: false,
  };
}
