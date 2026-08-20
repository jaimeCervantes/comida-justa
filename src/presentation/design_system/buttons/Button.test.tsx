import { getByText, render } from "@testing-library/react";
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

  /* Regresión del brinco del menú: al pulsar "Publicar" o "Iniciar sesión", el loader se sumaba
     al flujo del botón y lo ensanchaba ~28px, empujando a los hermanos del header. jsdom no
     calcula layout, así que se comprueba el mecanismo que lo decide: el contenido conserva su
     caja (`invisible`, no `hidden`) y la ruedita se pinta superpuesta, fuera del flujo. */
  it("Then the loader is overlaid instead of taking up space in the flow", () => {
    const { getByRole, getByTitle } = render(
      <Button isLoading loadingLabel="Cargando">
        Publicar
      </Button>,
    );
    const button = getByRole("button");

    expect(button).toHaveAttribute("aria-busy", "true");

    // El contenido sigue en el DOM: es lo que sostiene el ancho del botón.
    const label = getByText(button, "Publicar");
    expect(label).toBeInTheDocument();
    expect(label.closest("span")).toHaveClass("invisible");

    // La ruedita no comparte contenedor con la etiqueta: va en una capa absoluta.
    const spinnerLayer = getByTitle("Cargando").closest("span");
    expect(spinnerLayer).toHaveClass("absolute");
    expect(spinnerLayer).not.toBe(label.closest("span"));
  });

  it("Then a button that is not loading renders no overlay", () => {
    const { getByRole } = render(<Button>Publicar</Button>);
    const button = getByRole("button");

    expect(button).toHaveAttribute("aria-busy", "false");
    expect(button.querySelector(".absolute")).toBeNull();
  });

  /**
   * Slice 11. El slice 10 arregló el token —`--brand-green` dejó de ser la semilla del logo y pasó
   * al relleno que sí aguanta blanco—, pero mientras el botón pidiera `bg-pw-green` a mano seguía
   * decidiendo su propio color. Ahora pide el **par** (relleno + su texto), que es lo que
   * `brandPalette.contrast.test.ts` mide en los dos temas: el tema oscuro mueve el par entero sin
   * que este componente se entere.
   */
  describe("pide su color al par semántico", () => {
    it.each([
      ["green", "bg-button-primary-bg", "text-button-primary-text"],
      ["orange", "bg-button-buy-bg", "text-button-buy-text"],
      ["default", "bg-button-secondary-bg", "text-button-secondary-text"],
    ] as const)("el color %s", (color, fill, ink) => {
      const { getByRole } = render(<Button color={color}>Publicar</Button>);
      const button = getByRole("button");

      expect(button).toHaveClass(fill);
      expect(button).toHaveClass(ink);
    });

    it("ya no nombra el verde de marca a pelo", () => {
      const { getByRole } = render(<Button color="green">Publicar</Button>);

      expect(getByRole("button").className).not.toMatch(/bg-pw-green/);
    });
  });

  /**
   * 44px es el objetivo táctil mínimo con el que un pulgar acierta. `md` y `lg` lo cumplen; `xs` y
   * `sm` existen para barras densas de escritorio y declaran su altura igual, para que nadie los
   * use en un teléfono creyendo que miden lo mismo.
   */
  it.each([
    ["xs", "min-h-8"],
    ["sm", "min-h-10"],
    ["md", "min-h-12"],
    ["lg", "min-h-14"],
  ] as const)(
    "el tamaño %s declara su altura mínima (%s)",
    (size, minHeight) => {
      const { getByRole } = render(<Button size={size}>Publicar</Button>);

      expect(getByRole("button")).toHaveClass(minHeight);
    },
  );

  it("redondea con el radio que tiene nombre, no con uno elegido a mano", () => {
    const { getByRole } = render(<Button>Publicar</Button>);
    const button = getByRole("button");

    expect(button).toHaveClass("rounded-control");
    expect(button.className).not.toMatch(/rounded-lg/);
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
