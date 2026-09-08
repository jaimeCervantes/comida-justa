import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PracticeCover from "./PracticeCover";

describe("PracticeCover", () => {
  it.each([
    ["sueno_y_descanso", "sleep", "Sueño"],
    ["alimentacion", "nutrition", "Alimentación"],
    ["movimiento_y_ejercicio", "movement", "Movimiento"],
    ["mente_y_espiritu", "mindSpirit", "Mente/Espíritu"],
  ])("nombra el pilar de la categoría %s", (category, pillar, label) => {
    renderWithIntl(<PracticeCover category={category} />);

    const cover = screen.getByTestId("practice-cover");

    expect(cover).toHaveAttribute("data-pillar", pillar);
    expect(cover).toHaveTextContent(label);
  });

  /* El color nunca va solo: Movimiento y Mente contrastan 1.14 entre sí como tinta. */
  it("acompaña el color con el número del pilar", () => {
    renderWithIntl(<PracticeCover category="movimiento_y_ejercicio" />);

    expect(screen.getByTestId("practice-cover")).toHaveTextContent("3");
  });

  /* Una categoría que no cuelga de ningún pilar no tiene portada que inventar. */
  it.each([["otra_cosa"], [null], [undefined]])(
    "no pinta nada sin pilar (%s)",
    (category) => {
      renderWithIntl(<PracticeCover category={category} />);

      expect(screen.queryByTestId("practice-cover")).not.toBeInTheDocument();
    },
  );
});
