import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { StockState } from "~/presentation/post/stockAction";
import StockControl from "./StockControl";

const noopStock = async (): Promise<StockState> => ({});

function render(props: Partial<Parameters<typeof StockControl>[0]> = {}) {
  return renderWithIntl(
    <StockControl
      action={noopStock}
      postId="post-1"
      slug="dona-chocolate-keto"
      kind="producto"
      stockQuantity={null}
      {...props}
    />,
  );
}

const saveButton = () => screen.queryByRole("button", { name: /guardar/i });

describe("StockControl", () => {
  /*
   * Escenario `@component` de `listadosCompactos.feature`: ningún botón se queda sin icono.
   *
   * Se afirma que hay **un** icono, no cuál: cambiar el dibujo es una decisión de diseño y no
   * tiene por qué costar una prueba.
   */
  it("guardar se reconoce por su dibujo, no sólo por su texto", () => {
    render();

    expect(saveButton()?.querySelector("svg")).toBeInTheDocument();
  });

  /*
   * El campo nace vacío cuando nadie está contando, y ese vacío es información: dice «todavía no
   * se lleva la cuenta», que no es lo mismo que un cero. Es la diferencia que separa
   * `canTrackStock` de `carriesInventory`, y la que decide si el interruptor manual sigue estando.
   */
  it("el campo nace vacío mientras nadie lleve la cuenta", () => {
    render();

    expect(screen.getByTestId("stock-input")).toHaveValue(null);
  });

  it("y trae lo guardado en cuanto alguien la lleva", () => {
    render({ stockQuantity: 12 });

    expect(screen.getByTestId("stock-input")).toHaveValue(12);
  });

  /* Sólo un producto se entrega contado en piezas. Ocultarlo en lo demás es cortesía, no
     seguridad: quien decide es el servidor. */
  it("un servicio no cuenta ejemplares", () => {
    render({ kind: "servicio" });

    expect(screen.queryByTestId("stock-input")).not.toBeInTheDocument();
  });
});
