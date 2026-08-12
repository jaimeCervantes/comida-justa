import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SleepPracticeContent from "./SleepPracticeContent";

vi.mock("../sleepChallengeActions", () => ({
  manageAtomicSleepChallenge: vi.fn(),
}));

describe("SleepPracticeContent", () => {
  it("adds the complete practice without creating a second page heading", () => {
    renderWithIntl(
      <SleepPracticeContent
        initialProgress={null}
        signedIn
        signInHref="/auth/signin?callbackUrl=%2Fpilares%2Fsueno"
      />,
    );

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByText("Ponlo en práctica")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Del atardecer al amanecer",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Cerrar la noche" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Abrir la mañana" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Empezar Del atardecer al amanecer",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "El ritual que irá creciendo",
      }),
    ).toBeInTheDocument();
  });
});
