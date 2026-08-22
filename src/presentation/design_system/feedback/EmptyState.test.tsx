import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

/**
 * La regla de la sección 06 del canvas: un vacío dice **qué falta, por qué está bien que falte, y
 * qué hacer ahora**. Los treinta y tres vacíos del sitio decían casi todos solo la primera.
 */
describe("EmptyState", () => {
  it("dice las tres cosas: qué falta, por qué, y qué hacer", () => {
    render(
      <EmptyState
        title="Aún no hay productos ni servicios publicados."
        action={<a href="/publicar">Publicar lo mío</a>}
      >
        El catálogo lo hace quien vende.
      </EmptyState>,
    );

    expect(
      screen.getByRole("heading", { name: /aún no hay productos/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/lo hace quien vende/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Publicar lo mío" }),
    ).toHaveAttribute("href", "/publicar");
  });

  /*
   * El título es un encabezado de verdad: la sección se quedó sin contenido, no sin título. Quien
   * navega por encabezados tiene que poder encontrar dónde está.
   */
  it("el título es un encabezado, no un párrafo suelto", () => {
    render(<EmptyState title="Sin resultados" />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Sin resultados",
    );
  });

  /* Un vacío sin salida sigue siendo válido —el de otra persona, por ejemplo— y no deja huecos. */
  it("sin cuerpo ni acción no pinta contenedores vacíos", () => {
    const { container } = render(
      <EmptyState title="Esta tienda todavía no ha publicado nada." />,
    );

    expect(container.querySelector("p")).toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("se puede localizar por su testId", () => {
    render(<EmptyState testId="feed-empty" title="Nada aún" />);

    expect(screen.getByTestId("feed-empty")).toBeInTheDocument();
  });
});
