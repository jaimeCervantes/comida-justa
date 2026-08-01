import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

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
      </Button>,
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

  // Regresión: en el header, al mostrar su loader el botón "Publicar" le quitaba ancho al de
  // "Iniciar sesión", que partía la etiqueta en dos renglones y crecía de alto hasta romper la
  // altura fija del header. La etiqueta de un botón no envuelve salvo que se pida.
  it("Then the label does not wrap by default", () => {
    const { getByRole } = render(<Button>Iniciar sesión</Button>);

    expect(getByRole("button")).toHaveClass("whitespace-nowrap");
  });

  it("Then a long label can opt out of the no-wrap default", () => {
    const { getByRole } = render(
      <Button className="whitespace-normal">
        Sube tu mejor imagen o sube tu mejor video
      </Button>,
    );
    const button = getByRole("button");

    expect(button).toHaveClass("whitespace-normal");
    expect(button).not.toHaveClass("whitespace-nowrap");
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
      </Button>,
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
