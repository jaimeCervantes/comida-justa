import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import StoreDistance from "./StoreDistance";

/**
 * Cubre el `Scenario Outline` "La distancia se dice en la unidad que se entiende" de
 * `src/e2e/localProducers/localProducers.feature`. Va en Vitest porque es el armado del texto a
 * partir del catálogo: no hace falta ni base ni navegador para verificar un redondeo.
 */
describe("StoreDistance", () => {
  it.each<[number, string]>([
    [350, "350 m"],
    [999, "999 m"],
    [1500, "1.5 km"],
    [1483, "1.5 km"],
  ])("pinta %s metros como «a %s»", (meters, expected) => {
    renderWithIntl(<StoreDistance meters={meters} />);

    expect(screen.getByTestId("store-distance")).toHaveTextContent(
      `a ${expected}`,
    );
  });

  it("lo dice en inglés cuando la ruta va en inglés", () => {
    renderWithIntl(<StoreDistance meters={1500} />, { locale: "en" });

    expect(screen.getByTestId("store-distance")).toHaveTextContent(
      "1.5 km away",
    );
  });

  /* Sin distancia no se pinta un hueco que diga "desconocida": ocupa espacio para no decir nada. */
  it("no pinta nada cuando no hay distancia que decir", () => {
    const { container } = renderWithIntl(<StoreDistance meters={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
