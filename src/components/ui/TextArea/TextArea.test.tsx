import { screen } from "@testing-library/dom";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import TextArea from "./TextArea";
import { act } from "react-dom/test-utils";

describe("TextArea Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render component without crashing when no props are provided", () => {
    render(<TextArea />);
  });

  it("should renders label if provided", () => {
    const label = "Test Label";

    render(<TextArea label={label} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("should render textarea with correct props", () => {
    const maxLength = 100;
    const placeholder = "Test placeholder";
    const rows = 10;
    const name = "Test name";

    render(
      <TextArea
        maxLength={maxLength}
        placeholder={placeholder}
        rows={rows}
        name={name}
        required
      />,
    );

    const textarea = screen.getByTestId("TextArea");

    expect(textarea).toHaveAttribute("maxlength", maxLength.toString());
    expect(textarea).toHaveAttribute("placeholder", placeholder);
    expect(textarea).toHaveAttribute("rows", rows.toString());
    expect(textarea).toHaveAttribute("name", name);
    expect(textarea).toHaveAttribute("required");
  });

  it("should update text state", async () => {
    const user = userEvent.setup();
    const text = "Hola";

    render(<TextArea />);

    const textarea = await screen.findByTestId("TextArea");

    await act(async () => {
      await user.type(textarea, text);
    });

    expect(textarea).toHaveValue(text);
  });

  it("the maximum number of characters will be the total of the maxlength property", async () => {
    const text = "test maxlength";
    const maxLength = 15;

    const user = userEvent.setup();

    render(<TextArea maxLength={maxLength} />);

    const textarea = await screen.findByTestId("TextArea");
    await act(async () => {
      await user.type(textarea, text);
    });

    expect(textarea.value.length).toBeLessThanOrEqual(textarea.maxLength);
  });
});
