import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PostReactionButton from "./PostReactionButton";

vi.mock("./postReactionAction", () => ({
  setPostReaction: vi.fn(),
}));

vi.mock("~/i18n/navigation", () => ({
  usePathname: () => "/practica-penumbra-total",
}));

describe("PostReactionButton", () => {
  it("ofrece apoyar una publicación cuando hay sesión", () => {
    renderWithIntl(
      <PostReactionButton
        postId="post-1"
        reacted={false}
        reactions={0}
        canReact
      />,
    );

    expect(screen.getByTestId("post-reaction-toggle")).toHaveTextContent(
      "Apoyar",
    );
    expect(screen.getByTestId("post-reaction-count")).toHaveTextContent(
      "Nadie ha apoyado",
    );
  });

  it("permite retirar el apoyo propio", () => {
    renderWithIntl(
      <PostReactionButton postId="post-1" reacted reactions={1} canReact />,
    );

    expect(screen.getByTestId("post-reaction-toggle")).toHaveTextContent(
      "Retirar apoyo",
    );
    expect(screen.getByTestId("post-reaction-count")).toHaveTextContent(
      "1 apoyo",
    );
  });

  it("sin sesión conserva visible el reconocimiento y lleva a entrar", () => {
    renderWithIntl(
      <PostReactionButton
        postId="post-1"
        reacted={false}
        reactions={3}
        canReact={false}
        signInHref="/auth/signin?callbackUrl=%2Fpractica-penumbra-total"
      />,
    );

    expect(screen.getByTestId("post-reaction-signin")).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fpractica-penumbra-total",
    );
    expect(screen.getByTestId("post-reaction-count")).toHaveTextContent(
      "3 apoyos",
    );
  });
});
