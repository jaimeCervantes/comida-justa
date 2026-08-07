import type { RenderResult } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Link } from "~/i18n/navigation";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import MediaContent from "~/presentation/media/MediaContent/MediaContent";
import Card from "./Card";
import { props } from "./dummies/props";

describe("When a Card is rendered", () => {
  let cardView: RenderResult;

  beforeEach(() => {
    cardView = render(
      <Card
        {...props}
        media={
          <Link {...props.anchorProps}>
            <MediaContent
              media={{
                url: "https://ruta/de/imagen/1.webp",
                type: "image",
                alt: "Ensalada con frutas",
              }}
            />
          </Link>
        }
      ></Card>,
    );
  });

  it("Then the title should be shown", async () => {
    const title = cardView.getByText(props.title);
    expect(title).toBeInTheDocument();
  });

  it("Then at least one image should be shown", async () => {
    const image = cardView.getByRole("img");
    expect(image).toBeInTheDocument();
  });

  it("Then the Container prop should be an article by default", () => {
    const article = cardView.container.querySelector("article");
    expect(article).toBeInTheDocument();
  });
});

it("When Container prop is a section, then the container should be a section", () => {
  const { container } = render(<Card Container="section" {...props} />);
  const section = container.querySelector("section");
  expect(section).toBeInTheDocument();
});

it("When Container prop is a Component, then the container should be the Component wrapper", () => {
  function MyComponent({ children }: { children: React.JSX.Element }) {
    return <div>{children}</div>;
  }

  const { container } = render(<Card Container={MyComponent} {...props} />);
  const section = container.querySelector("div");
  expect(section).toBeInTheDocument();
});

it("When no AnchorElement prop is passed, then AnchorElement should be an 'a' by default", () => {
  const { container } = render(<Card {...props} />);
  const anchor = container.querySelector("a");
  expect(anchor).toBeInTheDocument();
});

it("When AnchorElement prop is a Component, then the AnchorElement should render a Component", () => {
  function MyAnchorComponent({
    children,
    href,
  }: {
    children: React.JSX.Element;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  }

  const { container } = render(
    <Card AnchorElement={MyAnchorComponent} {...props} />,
  );
  const section = container.querySelector("a");
  expect(section).toBeInTheDocument();
});
