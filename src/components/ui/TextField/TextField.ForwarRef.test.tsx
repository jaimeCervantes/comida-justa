import { useRef } from "react";
import { describe, it, afterEach, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextField from "./TextField";
import type { TextFieldRefType } from "./TextField.d";

describe("When TextField forwarded with an external ref", () => {
  it("Then it should be focus when it is loaded in a form", async () => {
    const user = userEvent.setup();
    const view = render(<ForwardedRefInFormWithTextField />);
    const btn = view.getByRole("button", { name: "focus" });

    await user.click(btn);

    const field = view.getByRole("textbox", { name: "Nombre" });
    expect(field).toHaveFocus();
  });
});

function ForwardedRefInFormWithTextField() {
  const ref = useRef<TextFieldRefType>(null);

  return (
    <form onSubmit={(e) => e.preventDefault}>
      <TextField
        ref={ref}
        label="Nombre"
        name="nombre"
        type="text"
        required
        pattern="[a-zA-Z]{3,50}"
      />
      <button onClick={() => ref?.current?.focus()}>focus</button>
    </form>
  );
}
