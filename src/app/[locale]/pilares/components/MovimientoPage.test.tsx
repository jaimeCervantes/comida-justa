import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import MovimientoPage from "./MovimientoPage";

/** La práctica es asíncrona y lee la sesión; aquí se comprueba la guía que la rodea. */
vi.mock("./PillarPractice", () => ({
  default: () => <section data-testid="pillar-practice" />,
}));

/* Y la seccion local lee la base y la sesion: misma frontera, mismo corte. */
vi.mock("./PillarLocal", () => ({
  default: () => <section data-testid="pillar-local" />,
}));

function sectionOf(heading: string): HTMLElement {
  const title = screen.getByRole("heading", { name: heading });
  const section = title.closest("section");
  if (!section) throw new Error(`«${heading}» no vive dentro de una sección`);
  return section;
}

describe("el costo oculto de mover dos cuadras en motor", () => {
  it("nombra la gasolina, el aire y el cuerpo con su consecuencia", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const costs = sectionOf("El costo oculto de mover dos cuadras en motor");

    expect(within(costs).getByText("La gasolina:")).toBeInTheDocument();
    /* «cabía a pie» cierra el costo y el contrapeso a propósito —es la misma frase devuelta como
       respuesta—, así que aquí se afirma la parte que solo tiene el costo. */
    expect(
      within(costs).getByText(/varias veces por semana/),
    ).toBeInTheDocument();
    expect(within(costs).getByText("El aire y el ruido:")).toBeInTheDocument();
    expect(within(costs).getByText(/tu propia calle/)).toBeInTheDocument();
    expect(within(costs).getByText("El cuerpo:")).toBeInTheDocument();
    expect(within(costs).getByText(/gasto espontáneo/)).toBeInTheDocument();
  });

  it("pone la movilidad activa junto al costo, no en otra sección", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const costs = sectionOf("El costo oculto de mover dos cuadras en motor");

    expect(
      within(costs).getByRole("heading", {
        name: "El contrapeso: tu territorio es el espacio de movimiento",
      }),
    ).toBeInTheDocument();
  });

  it("mantiene el costo antes de la práctica", () => {
    const { container } = renderWithIntl(<MovimientoPage locale="es" />);
    const costs = sectionOf("El costo oculto de mover dos cuadras en motor");
    const practice = screen.getByTestId("pillar-practice");

    expect(
      costs.compareDocumentPosition(practice) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("main")).toBeNull();
  });
});

describe("la cadencia del día", () => {
  /**
   * La frecuencia es lo que manda, no el volumen: tres bloques por «cada cuánto» y ni una serie ni
   * un kilómetro que invite a comparar.
   */
  it("ordena el día por frecuencia y no por cantidad", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const cadence = sectionOf("La cadencia del día");
    const tiers = within(cadence).getAllByRole("listitem");

    expect(tiers).toHaveLength(3);
    expect(
      within(tiers[0] as HTMLElement).getByText("Cada 50 min"),
    ).toBeVisible();
    expect(
      within(tiers[0] as HTMLElement).getByRole("heading", {
        name: "Dos minutos de pie",
      }),
    ).toBeInTheDocument();
    expect(within(tiers[1] as HTMLElement).getByText("Cada día")).toBeVisible();
    expect(
      within(tiers[2] as HTMLElement).getByText("Cada semana"),
    ).toBeVisible();
  });

  /**
   * «Los puntos no miden volumen» se lee como «no te molestes en hacer más» si no se dice la otra
   * mitad. Las dos frases van juntas, y esta prueba existe para que sigan yendo juntas.
   */
  it("dice que hacer más conviene aunque no dé más puntos", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const cadence = sectionOf("La cadencia del día");

    expect(within(cadence).getByText(/mejor para ti/)).toBeInTheDocument();
    expect(
      within(cadence).getByText(/un piso, no un techo/),
    ).toBeInTheDocument();
    expect(
      within(cadence).getByText(/cuentan días y no volumen/),
    ).toBeInTheDocument();
  });

  /** El gimnasio del barrio es un negocio local, no la alternativa a evitar. */
  it("cuenta el gimnasio y el estudio de la zona como movimiento local", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const cadence = sectionOf("La cadencia del día");

    expect(
      within(cadence).getByText(/gimnasio, el estudio o la clase de tu zona/),
    ).toBeInTheDocument();
    expect(
      within(cadence).getByText(/negocios del barrio y cuentan igual/),
    ).toBeInTheDocument();
  });
});

describe("el pie y el terreno", () => {
  /** «Usa calzado cómodo» no le sirve a nadie frente al estante: los tres criterios se verifican. */
  it("da tres criterios verificables del calzado funcional", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const foot = sectionOf("El pie y el terreno");

    expect(within(foot).getByText(/Horma ancha/)).toBeInTheDocument();
    expect(within(foot).getByText(/Suela flexible/)).toBeInTheDocument();
    expect(within(foot).getByText(/Drop cero o bajo/)).toBeInTheDocument();
  });

  it("avisa de que la transición de calzado va poco a poco", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const foot = sectionOf("El pie y el terreno");

    expect(
      within(foot).getByText(/necesita semanas para adaptarse/),
    ).toBeVisible();
  });
});

describe("el catálogo de formas de movimiento", () => {
  it("da a las cuatro categorías su impacto en el cuerpo y en la comunidad", () => {
    renderWithIntl(<MovimientoPage locale="es" />);
    const catalog = sectionOf("Catálogo de formas de movimiento");

    for (const category of [
      "Proximidad y pausas activas",
      "Biomecánica y terreno natural",
      "Fuerza funcional y trabajo de campo",
      "Resistencia y deporte de comunidad",
    ]) {
      const card = within(catalog)
        .getByRole("heading", { name: category })
        .closest("li") as HTMLElement;

      expect(
        within(card).getByText("En el cuerpo y la postura"),
      ).toBeInTheDocument();
      expect(
        within(card).getByText("En la comunidad y el entorno"),
      ).toBeInTheDocument();
      expect(
        within(card).getAllByRole("listitem").length,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("no usa una tabla que obligue a desplazarse a lo ancho", () => {
    const { container } = renderWithIntl(<MovimientoPage locale="es" />);

    expect(container.querySelector("table")).toBeNull();
  });
});

describe("el pilar en inglés", () => {
  it("traduce el costo oculto, la cadencia, el pie y el catálogo", () => {
    renderWithIntl(<MovimientoPage locale="en" />, { locale: "en" });

    for (const heading of [
      "The hidden cost of driving two blocks",
      "The counterweight: your territory is the place you move",
      "The rhythm of the day",
      "The foot and the ground",
      "A catalogue of ways to move",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
  });
});
