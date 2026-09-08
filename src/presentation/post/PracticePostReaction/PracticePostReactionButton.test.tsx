import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PracticePostReactionButton from "./PracticePostReactionButton";

vi.mock("./practicePostReactionAction", () => ({
  setPracticePostReaction: vi.fn(),
}));

vi.mock("~/i18n/navigation", () => ({
  usePathname: () => "/practica-penumbra-total",
}));

describe("PracticePostReactionButton", () => {
  it("ofrece apoyar una práctica cuando hay sesión", () => {
    renderWithIntl(
      <PracticePostReactionButton
        postId="post-1"
        reacted={false}
        reactions={0}
        canReact
      />,
    );

    expect(
      screen.getByTestId("practice-post-reaction-toggle"),
    ).toHaveTextContent("Apoyar");
    expect(
      screen.getByTestId("practice-post-reaction-count"),
    ).toHaveTextContent("Nadie ha apoyado");
  });

  it("permite retirar el apoyo propio", () => {
    renderWithIntl(
      <PracticePostReactionButton
        postId="post-1"
        reacted
        reactions={1}
        canReact
      />,
    );

    expect(
      screen.getByTestId("practice-post-reaction-toggle"),
    ).toHaveTextContent("Retirar apoyo");
    expect(
      screen.getByTestId("practice-post-reaction-count"),
    ).toHaveTextContent("1 apoyo");
  });

  it("sin sesión conserva visible el reconocimiento y lleva a entrar", () => {
    renderWithIntl(
      <PracticePostReactionButton
        postId="post-1"
        reacted={false}
        reactions={3}
        canReact={false}
        signInHref="/auth/signin?callbackUrl=%2Fpractica-penumbra-total"
      />,
    );

    expect(screen.getByTestId("practice-post-reaction-signin")).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fpractica-penumbra-total",
    );
    expect(
      screen.getByTestId("practice-post-reaction-count"),
    ).toHaveTextContent("3 apoyos");
  });
});
