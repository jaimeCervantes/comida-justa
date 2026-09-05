import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AlimentacionPage from "./AlimentacionPage";

/** La práctica es asíncrona y lee la sesión; aquí se comprueba la guía que la rodea. */
vi.mock("./PillarPractice", () => ({
  default: () => <section data-testid="pillar-practice" />,
}));

/* Y la seccion local lee la base y la sesion: misma frontera, mismo corte. */
vi.mock("./PillarLocal", () => ({
  default: () => <section data-testid="pillar-local" />,
}));

/* Y la bibliografía consulta `pillar_studies`: tercera frontera asíncrona, mismo corte. Lo que la
   lista promete se comprueba en `PillarReferences.test.tsx`, con estudios fijos. */
vi.mock("./PillarBibliography", () => ({
  default: () => <section data-testid="pillar-bibliography" />,
}));

function sectionOf(heading: string): HTMLElement {
  const title = screen.getByRole("heading", { name: heading });
  const section = title.closest("section");
  if (!section) throw new Error(`«${heading}» no vive dentro de una sección`);
  return section;
}

describe("el costo oculto de la cadena global", () => {
  /**
   * Los tres costos van con su consecuencia y no como lista de sustantivos: «empaques» no le dice
   * nada a nadie, «plástico de un solo uso que existe para que la comida sobreviva la bodega» sí.
   */
  it("nombra el traslado, los empaques y el desperdicio", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const costs = sectionOf("El costo oculto de la cadena global");

    expect(within(costs).getByText("El traslado:")).toBeInTheDocument();
    expect(within(costs).getByText(/emisiones de CO₂/)).toBeInTheDocument();
    expect(within(costs).getByText("Los empaques:")).toBeInTheDocument();
    expect(within(costs).getByText(/un solo uso/)).toBeInTheDocument();
    expect(within(costs).getByText("El desperdicio:")).toBeInTheDocument();
    expect(within(costs).getByText(/cámaras frías/)).toBeInTheDocument();
  });

  /**
   * El contrapeso vive en la misma sección que el costo. Separarlos convertía la proximidad en una
   * preferencia estética en vez de en la respuesta a algo que se paga.
   */
  it("pone la proximidad junto al costo, no en otra sección", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const costs = sectionOf("El costo oculto de la cadena global");

    expect(
      within(costs).getByRole("heading", {
        name: "El contrapeso: proximidad y temporada",
      }),
    ).toBeInTheDocument();
    expect(within(costs).getByText(/se cosecha maduro/)).toBeInTheDocument();
  });

  it("mantiene el costo antes de la práctica", () => {
    const { container } = renderWithIntl(<AlimentacionPage locale="es" />);
    const costs = sectionOf("El costo oculto de la cadena global");
    const practice = screen.getByTestId("pillar-practice");

    expect(
      costs.compareDocumentPosition(practice) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("main")).toBeNull();
  });
});

describe("la triada del plato", () => {
  /**
   * El ancho de cada bloque es su porcentaje: así la regla se entiende antes de leerla. Si alguien
   * cambia las clases por tres columnas iguales, la sección seguiría diciendo «50 %» mientras
   * dibuja un tercio, que es peor que no dibujar nada.
   */
  it("dibuja la proporción además de escribirla", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const triad = sectionOf("La triada del plato equilibrado");
    const [vegetables, protein, carbs] = within(triad).getAllByRole("listitem");

    expect(within(vegetables as HTMLElement).getByText("50 %")).toBeVisible();
    expect((vegetables as HTMLElement).className).toContain("sm:basis-1/2");
    expect((protein as HTMLElement).className).toContain("sm:basis-1/4");
    expect((carbs as HTMLElement).className).toContain("sm:basis-1/4");
  });

  /** La grasa se suma al plato, no lo divide: por eso vive fuera de la barra de proporciones. */
  it("deja la porción de grasa fuera de la barra", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const triad = sectionOf("La triada del plato equilibrado");

    expect(within(triad).getAllByRole("listitem")).toHaveLength(3);
    expect(within(triad).getByText("1 porción")).toBeVisible();
    expect(
      within(triad).getByRole("heading", {
        name: "Grasas sanas de la región",
      }),
    ).toBeInTheDocument();
  });

  it("señala dónde se cumple una planta más", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const triad = sectionOf("La triada del plato equilibrado");

    expect(within(triad).getByText(/«una planta más»/)).toBeInTheDocument();
  });
});

describe("la cocción limpia", () => {
  it("nombra los aceites de semillas que salen y por qué", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const cooking = sectionOf("Cocción limpia, sin aceites refinados");

    expect(within(cooking).getByText(/cártamo, canola, girasol/)).toBeVisible();
    expect(within(cooking).getByText(/aldehídos/)).toBeVisible();
  });

  /**
   * Cada aceite lleva su uso y su temperatura. «Usa aceite de oliva» se rompe en la primera sartén
   * caliente: lo que decide si ayuda o daña es a qué fuego se le pone.
   *
   * Los 250 °C son del aceite **sin refinar**, que es el que este pilar recomienda; los 271 °C que
   * medio internet le atribuye son los del refinado. Confundirlos manda a alguien a calentar a
   * 270 °C un aceite que empieza a humear veinte grados antes, así que la prueba fija los dos.
   */
  it("da a cada aceite su uso y su punto de humo", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const cooking = sectionOf("Cocción limpia, sin aceites refinados");

    expect(within(cooking).getByText(/Sin refinar.*250 °C/)).toBeVisible();
    expect(within(cooking).getByText(/refinado llega a 271 °C/)).toBeVisible();
    expect(within(cooking).getByText(/Crudo o fuego bajo/)).toBeVisible();
  });

  it("ofrece los métodos que no necesitan grasa añadida", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const cooking = sectionOf("Cocción limpia, sin aceites refinados");

    expect(
      within(cooking).getByText(/Vapor, freidora de aire/),
    ).toBeInTheDocument();
  });
});

describe("el catálogo de ingredientes", () => {
  /** Cada categoría dice las tres cosas; una tarjeta sin impacto ecológico vuelve opcional lo local. */
  it("da a las cuatro categorías su impacto en el cuerpo y en el entorno", () => {
    renderWithIntl(<AlimentacionPage locale="es" />);
    const catalog = sectionOf("Catálogo de ingredientes de proximidad");

    for (const category of [
      "Proteínas de calidad",
      "Carbohidratos complejos",
      "Grasas saludables",
      "Aceites sanos y cocción limpia",
    ]) {
      const card = within(catalog)
        .getByRole("heading", { name: category })
        .closest("li") as HTMLElement;

      expect(within(card).getByText("En el cuerpo")).toBeInTheDocument();
      expect(
        within(card).getByText("En el entorno y la economía local"),
      ).toBeInTheDocument();
      expect(
        within(card).getAllByRole("listitem").length,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  /**
   * La fuente de esto es una tabla de cuatro columnas. Trasladarla tal cual habría desbordado la
   * página a lo ancho justo en el teléfono, que es donde se consulta al comprar.
   */
  it("no usa una tabla que obligue a desplazarse a lo ancho", () => {
    const { container } = renderWithIntl(<AlimentacionPage locale="es" />);

    expect(container.querySelector("table")).toBeNull();
  });
});

describe("el pilar en inglés", () => {
  it("traduce el costo oculto, la guía y el catálogo", () => {
    renderWithIntl(<AlimentacionPage locale="en" />, { locale: "en" });

    for (const heading of [
      "The hidden cost of the global chain",
      "The counterweight: proximity and season",
      "The balanced plate triad",
      "Clean cooking, without refined oils",
      "A catalogue of nearby ingredients",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
  });
});
