import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { TextField } from "./TextField";

describe("When TextField forwarded with an external ref", () => {
  it("Then it should be focus when it is loaded in a form", async () => {
    const user = userEvent.setup();
    const view = render(<ForwardedRefInFormWithTextField />);
    const btn = view.getByRole("button", { name: "focus" });

    await user.click(btn);

    const field = view.getByRole("textbox", { name: /Nombre/i });
    expect(field).toHaveFocus();
  });
});

function ForwardedRefInFormWithTextField() {
  // `TextField` es `forwardRef<HTMLInputElement, TextFieldProps>`, así que este es su tipo de ref.
  // Antes decía `TextFieldRefType`, un nombre que no existe en ninguna parte.
  const ref = useRef<HTMLInputElement>(null);

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
      <button type="button" onClick={() => ref?.current?.focus()}>
        focus
      </button>
    </form>
  );
}
