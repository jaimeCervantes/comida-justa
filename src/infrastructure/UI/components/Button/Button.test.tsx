import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import Button from "./Button";

describe("Button component", () => {
  it("should render component without crashing when no props are provided", () => {
    render(<Button />);
  });

  it("Then the component should be shown with default props", () => {
    const { getByRole } = render(<Button />);
    const button = getByRole("button");

    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute("id");
    expect(button).not.toBeDisabled();
  });

  it("Then if have a children this should be showm", () => {
    const { getByRole } = render(
      <Button>
        <span>I am a children</span>
      </Button>
    );
    const button = getByRole("button");

    expect(button).toHaveTextContent("I am a children");
  });

  it("onClick prop", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = render(<Button onClick={onClick} />);
    const button = getByRole("button");

    await user.click(button);

    expect(onClick).toBeCalled();
  });

  it("Then when props exist the button should be shown with this props", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    const { getByRole } = render(
      <Button
        size="sm"
        disabled
        className="test-class"
        type="reset"
        onClick={onClick}
      >
        <span> children test</span>
      </Button>
    );

    const button = getByRole("button");

    await user.click(button);

    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("type", "reset");
    expect(button).toHaveTextContent("children test");
    expect(onClick).not.toBeCalled();
  });
});
