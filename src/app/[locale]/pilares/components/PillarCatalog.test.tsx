import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PillarCatalog, { type PillarCatalogCategory } from "./PillarCatalog";

/**
 * Lo que la tarjeta del catálogo promete, con temas fijos.
 *
 * Estas afirmaciones vivían dentro de las pruebas de las cuatro páginas, que las comprobaban contra
 * el catálogo de idiomas. Desde que los temas viven en `pillar_themes`, afirmarlas desde la página
 * exigiría montar una conexión para comprobar una decisión de presentación. Los datos son los reales
 * de la semilla del pilar del descanso.
 */
const TEMAS: readonly PillarCatalogCategory[] = [
  {
    title: "Anclaje de luz solar",
    items: ["Anclar la mañana con sol", "Recibir la luz del atardecer"],
    bodyImpact:
      "Ajusta el reloj interno, levanta el ánimo por la mañana y programa la melatonina de la noche siguiente.",
    localImpact:
      "Saca la vida a la calle a las horas en que el barrio está despierto, y ahorra luz artificial durante el día.",
  },
  {
    title: "Cierre mental y calma",
    items: ["La descarga mental", "Un libro en papel junto a la cama"],
    bodyImpact:
      "Libera la cabeza de lo pendiente, frena la rumiación y baja el pulso.",
    localImpact:
      "Se apoya en plantas que se consiguen a granel y de temporada.",
  },
];

function render(categories: readonly PillarCatalogCategory[] = TEMAS) {
  return renderWithIntl(
    <PillarCatalog
      pillar="sleep"
      heading="Catálogo de prácticas de descanso"
      intro="Qué hacer, qué le hace a tu cuerpo y qué le hace a tu recibo de luz."
      bodyLabel="En el cuerpo y el ánimo"
      localLabel="En el gasto y el entorno"
      browseLabel="Ver el catálogo de prácticas"
      categories={categories}
    />,
  );
}

function cardFor(title: string): HTMLElement {
  const card = screen.getByRole("heading", { name: title }).closest("li");
  if (!card) throw new Error(`«${title}» no vive dentro de una tarjeta`);
  return card;
}

describe("el catálogo de un pilar", () => {
  it("da a cada tema sus dos impactos", () => {
    /* Una tarjeta sin impacto en el entorno volvería opcional la mitad que sostiene al barrio: son
       la misma decisión, y por eso van juntos. */
    render();

    for (const { title } of TEMAS) {
      const card = cardFor(title);
      expect(
        within(card).getByText("En el cuerpo y el ánimo"),
      ).toBeInTheDocument();
      expect(
        within(card).getByText("En el gasto y el entorno"),
      ).toBeInTheDocument();
    }
  });

  it("nombra las prácticas que agrupa cada tema", () => {
    render();

    expect(
      within(cardFor("Anclaje de luz solar")).getByText(
        "Anclar la mañana con sol",
      ),
    ).toBeInTheDocument();
    expect(
      within(cardFor("Cierre mental y calma")).getByText("La descarga mental"),
    ).toBeInTheDocument();
  });

  it("lleva al detalle, que es donde cada práctica dice cuándo se hace", () => {
    // La tarjeta es un resumen: el ancla y la evidencia viven en el índice.
    render();

    expect(
      screen.getByRole("link", { name: /catálogo de prácticas/i }),
    ).toBeInTheDocument();
  });

  it("no usa una tabla que obligue a desplazarse a lo ancho", () => {
    /* Las fuentes eran tablas de cuatro columnas y se consultan en el teléfono, al comprar o al
       decidir qué hacer esta tarde. Cada tema se lee entero de arriba abajo. */
    const { container } = render();

    expect(container.querySelector("table")).toBeNull();
  });

  it("reparte por número de temas, sin exigir cuatro", () => {
    // Sueño tiene tres y no cuatro: la fuente tiene tres, y rellenar una cuarta sería inventar.
    render([TEMAS[0]]);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
  });
});
