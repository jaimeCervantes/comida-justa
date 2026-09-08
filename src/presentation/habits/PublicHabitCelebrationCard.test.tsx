import { screen } from "@testing-library/react";
import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import PublicHabitCelebrationCard from "./PublicHabitCelebrationCard";

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("~/i18n/messages/es.json")).default;

  return {
    getTranslations: async (
      namespace: "atomicSleepChallenge" | "atomicChallenges",
    ) => createTranslator({ locale: "es", messages, namespace }),
  };
});

describe("PublicHabitCelebrationCard", () => {
  it("convierte el alias publico en puerta al perfil", async () => {
    await renderCard({ username: "healthy-food" });

    expect(screen.getByTestId("public-habit-profile-link")).toHaveAttribute(
      "href",
      "/u/healthy-food",
    );
    expect(screen.getByTestId("public-habit-profile-link")).toHaveTextContent(
      "@healthy-food",
    );
  });

  it("no inventa destino de perfil cuando la celebracion no tiene alias", async () => {
    await renderCard({ username: null });

    expect(
      screen.queryByTestId("public-habit-profile-link"),
    ).not.toBeInTheDocument();
  });
});

async function renderCard({
  username,
}: {
  username: string | null;
}): Promise<void> {
  const card = await PublicHabitCelebrationCard({
    celebration: celebration({ username }),
    signInHref: "/auth/signin",
  });
  if (!isValidElement(card)) {
    throw new Error("PublicHabitCelebrationCard must render a React element.");
  }
  renderWithIntl(card);
}

function celebration({
  username,
}: {
  username: string | null;
}): PublicHabitCelebration {
  return {
    id: "celebration-1",
    challengeKey: "sleep-evening-to-morning-v1",
    displayName: "Healthy Food",
    username,
    image: null,
    publishedAt: new Date("2026-08-11T12:00:00Z"),
    milestone: "first_cycle",
    reactionCount: 0,
    viewerReacted: false,
  };
}
