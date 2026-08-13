import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import MenteEspirituPage from "./MenteEspirituPage";

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

describe("el costo oculto de la hiperconectividad", () => {
  it("nombra la saturación, el desarraigo y la soledad acompañada", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const costs = sectionOf("El costo oculto de la hiperconectividad");

    expect(within(costs).getByText("La saturación:")).toBeInTheDocument();
    expect(
      within(costs).getByText(/sistema nervioso sin descanso/),
    ).toBeInTheDocument();
    expect(within(costs).getByText("El desarraigo:")).toBeInTheDocument();
    expect(
      within(costs).getByText(/dejas de reconocer a quien vive cerca/),
    ).toBeInTheDocument();
    expect(
      within(costs).getByText("La soledad acompañada:"),
    ).toBeInTheDocument();
    expect(
      within(costs).getByText(/no alimentan el afecto/),
    ).toBeInTheDocument();
  });

  it("pone el contrapeso junto al costo, no en otra sección", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const costs = sectionOf("El costo oculto de la hiperconectividad");

    expect(
      within(costs).getByRole("heading", {
        name: "El contrapeso: silencio, presencia y gente cercana",
      }),
    ).toBeInTheDocument();
  });

  it("mantiene el costo antes de la práctica", () => {
    const { container } = renderWithIntl(<MenteEspirituPage locale="es" />);
    const costs = sectionOf("El costo oculto de la hiperconectividad");
    const practice = screen.getByTestId("pillar-practice");

    expect(
      costs.compareDocumentPosition(practice) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("main")).toBeNull();
  });
});

describe("las ventanas de silencio", () => {
  /**
   * Tres momentos del día, ningún minuto que sumar. «Dos horas sin pantalla» convertiría la calma
   * en una métrica más, que es justo el problema del que viene quien lee esto.
   */
  it("ordena el día por momento y no por cantidad de minutos", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const windows = sectionOf("Las ventanas de silencio");
    const tiers = within(windows).getAllByRole("listitem");

    expect(tiers).toHaveLength(3);
    expect(
      within(tiers[0] as HTMLElement).getByText("Primera hora"),
    ).toBeVisible();
    expect(
      within(tiers[1] as HTMLElement).getByText("En la mesa"),
    ).toBeVisible();
    expect(
      within(tiers[2] as HTMLElement).getByText("Última hora"),
    ).toBeVisible();
  });

  /** La última ventana es la misma frontera que protege el sueño: el puente con el Pilar 1. */
  it("conecta la última hora con el descanso", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const windows = sectionOf("Las ventanas de silencio");

    expect(
      within(windows).getByText(/protege el sueño en el Pilar 1/),
    ).toBeInTheDocument();
  });
});

describe("el arraigo y la respiración", () => {
  /**
   * El rato al aire libre es el mismo que ya pide Movimiento. Decirlo evita que dos pilares
   * compitan por la agenda de la misma persona, que es como se abandonan los dos.
   */
  it("no pide una salida extra sobre la de Movimiento", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const grounding = sectionOf("Arraigo y respiración");

    expect(
      within(grounding).getByText(/mismo rato al aire libre que ya pide/),
    ).toBeInTheDocument();
  });

  /** Los tres tiempos se siguen mientras se hacen: lista ordenada, no párrafo. */
  it("da los tres tiempos de la respiración 4-7-8", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const grounding = sectionOf("Arraigo y respiración");
    const steps = within(grounding).getAllByRole("listitem");

    expect(steps).toHaveLength(3);
    expect(within(steps[0] as HTMLElement).getByText(/hasta 4/)).toBeVisible();
    expect(within(steps[1] as HTMLElement).getByText(/hasta 7/)).toBeVisible();
    expect(within(steps[2] as HTMLElement).getByText(/hasta 8/)).toBeVisible();
    /* La nota dice «respirar despacio», no «exhalar más largo»: el ensayo de 2024 que probó esa
       proporción, y su réplica, no encontraron diferencia de HRV entre 1:1 y 1:2. Lo que la
       evidencia sostiene es bajar las respiraciones por minuto. */
    expect(
      within(grounding).getByText(/Lo que calma es respirar despacio/),
    ).toBeInTheDocument();
    expect(
      within(grounding).getByText(/no llegar al 4-7-8 exacto/),
    ).toBeInTheDocument();
  });
});

describe("el catálogo de prácticas", () => {
  it("da a las cuatro categorías su impacto en la mente y en la comunidad", () => {
    renderWithIntl(<MenteEspirituPage locale="es" />);
    const catalog = sectionOf("Catálogo de prácticas de presencia");

    for (const category of [
      "Higiene digital y ayuno de pantallas",
      "Arraigo y contemplación en la naturaleza",
      "Diálogo presencial y gratitud",
      "Servicio y cooperación comunitaria",
    ]) {
      const card = within(catalog)
        .getByRole("heading", { name: category })
        .closest("li") as HTMLElement;

      expect(
        within(card).getByText("En la mente y las emociones"),
      ).toBeInTheDocument();
      expect(
        within(card).getByText("En la comunidad y el tejido social"),
      ).toBeInTheDocument();
      expect(
        within(card).getAllByRole("listitem").length,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("no usa una tabla que obligue a desplazarse a lo ancho", () => {
    const { container } = renderWithIntl(<MenteEspirituPage locale="es" />);

    expect(container.querySelector("table")).toBeNull();
  });
});

describe("el pilar en inglés", () => {
  it("traduce el costo oculto, las ventanas, el arraigo y el catálogo", () => {
    renderWithIntl(<MenteEspirituPage locale="en" />, { locale: "en" });

    for (const heading of [
      "The hidden cost of hyperconnectivity",
      "The counterweight: silence, presence and people nearby",
      "The windows of silence",
      "Grounding and breathing",
      "A catalogue of presence practices",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
  });
});
