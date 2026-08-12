import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SuenoPage from "./SuenoPage";

/** La práctica es asíncrona y lee la sesión; aquí se comprueba la guía que la rodea. */
vi.mock("./PillarPractice", () => ({
  default: () => <section data-testid="pillar-practice" />,
}));

function sectionOf(heading: string): HTMLElement {
  const title = screen.getByRole("heading", { name: heading });
  const section = title.closest("section");
  if (!section) throw new Error(`«${heading}» no vive dentro de una sección`);
  return section;
}

describe("el costo oculto de la luz artificial", () => {
  it("nombra el sueño roto, los estimulantes y la luz derramada", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const costs = sectionOf(
      "El costo oculto de la luz artificial y la cultura 24/7",
    );

    expect(within(costs).getByText("El sueño roto:")).toBeInTheDocument();
    expect(
      within(costs).getByText(/fases profundas y REM/),
    ).toBeInTheDocument();
    expect(
      within(costs).getByText("La deuda con estimulantes:"),
    ).toBeInTheDocument();
    expect(
      within(costs).getByText("La luz que se derrama:"),
    ).toBeInTheDocument();
    expect(
      within(costs).getByText(/contaminación lumínica/),
    ).toBeInTheDocument();
  });

  it("pone el contrapeso junto al costo, no en otra sección", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const costs = sectionOf(
      "El costo oculto de la luz artificial y la cultura 24/7",
    );

    expect(
      within(costs).getByRole("heading", {
        name: "El contrapeso: volver a sincronizar con la luz",
      }),
    ).toBeInTheDocument();
  });
});

describe("el santuario del descanso", () => {
  /**
   * Las tres condiciones son de entorno, no de fuerza de voluntad. Ese es el punto de la sección:
   * el cuarto deja de trabajar en contra, y no hace falta querer dormir mejor.
   */
  it("da las tres condiciones del cuarto", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const sanctuary = sectionOf("El santuario del descanso");
    const conditions = within(sanctuary).getAllByRole("listitem");

    expect(conditions).toHaveLength(3);
    expect(
      within(sanctuary).getByRole("heading", { name: "Oscuro" }),
    ).toBeInTheDocument();
    expect(
      within(sanctuary).getByRole("heading", { name: "Fresco y ventilado" }),
    ).toBeInTheDocument();
    expect(
      within(sanctuary).getByRole("heading", { name: "Sin teléfono" }),
    ).toBeInTheDocument();
  });

  it("explica por qué el cuarto tiene que estar fresco", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const sanctuary = sectionOf("El santuario del descanso");

    expect(
      within(sanctuary).getByText(/bajar cerca de un grado/),
    ).toBeVisible();
  });

  /** Sacar el teléfono es distancia física, no disciplina. Si se lee como consejo moral, falla. */
  it("presenta el teléfono fuera como diseño y no como fuerza de voluntad", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const sanctuary = sectionOf("El santuario del descanso");

    expect(
      within(sanctuary).getByText(/No es fuerza de voluntad/),
    ).toBeInTheDocument();
  });
});

describe("la descarga mental", () => {
  it("explica por qué la cabeza sigue dando vueltas, sin nombrar el marco", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const unload = sectionOf("La descarga mental");

    expect(
      within(unload).getByText(/una tarea sin cerrar se recuerda mejor/),
    ).toBeInTheDocument();
    expect(within(unload).queryByText(/Zeigarnik/i)).not.toBeInTheDocument();
  });

  it("dice que no hay que resolver nada, solo sacarlo", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const unload = sectionOf("La descarga mental");

    expect(
      within(unload).getByText(/No hay que resolverlo ni ordenarlo/),
    ).toBeInTheDocument();
  });

  /**
   * Anotar lo pendiente y anotar lo ya hecho no son intercambiables: medido con polisomnografía,
   * la lista de tareas adelantó el sueño y la de logros lo retrasó. Recomendar «escribe algo antes
   * de dormir» sin esa distinción manda a media gente a la versión que empeora las cosas.
   */
  it("distingue anotar lo pendiente de anotar lo ya hecho", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const unload = sectionOf("La descarga mental");

    expect(
      within(unload).getByText(/lo pendiente, no lo que ya hiciste/),
    ).toBeInTheDocument();
  });
});

describe("los puentes con los otros pilares", () => {
  /**
   * Los tres enlaces son de verdad y conservan el idioma: una cadena escrita a mano mandaría a un
   * lector en inglés a la versión en español.
   */
  it("enlaza a los otros tres pilares desde su propia tarjeta", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const bridges = sectionOf("Cómo llegan aquí los otros tres pilares");
    const links = within(bridges).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/pilares/alimentacion",
      "/pilares/movimiento",
      "/pilares/mente-espiritu",
    ]);
  });

  it("nombra el mecanismo de cada puente, no solo el pilar", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const bridges = sectionOf("Cómo llegan aquí los otros tres pilares");

    expect(
      within(bridges).getByText(/bajada de temperatura corporal/),
    ).toBeInTheDocument();
    expect(within(bridges).getByText(/presión de sueño/)).toBeInTheDocument();
    expect(
      within(bridges).getByText(/calman el sistema nervioso/),
    ).toBeInTheDocument();
  });

  it("conserva el idioma en los enlaces", () => {
    renderWithIntl(<SuenoPage locale="en" />, { locale: "en" });
    const bridges = sectionOf("How the other three pillars arrive here");

    expect(
      within(bridges)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/en/pillars/alimentacion",
      "/en/pillars/movimiento",
      "/en/pillars/mente-espiritu",
    ]);
  });
});

describe("el catálogo de prácticas de descanso", () => {
  /** Son tres y no cuatro: la fuente tiene tres, e inventar una cuarta por simetría sería relleno. */
  it("da a las tres categorías su impacto en el cuerpo y en el gasto", () => {
    renderWithIntl(<SuenoPage locale="es" />);
    const catalog = sectionOf("Catálogo de prácticas de descanso");

    for (const category of [
      "Anclaje de luz solar",
      "Ambiente y control de estímulos",
      "Cierre mental y calma",
    ]) {
      const card = within(catalog)
        .getByRole("heading", { name: category })
        .closest("li") as HTMLElement;

      expect(
        within(card).getByText("En el cuerpo y el ánimo"),
      ).toBeInTheDocument();
      expect(
        within(card).getByText("En el gasto y el entorno"),
      ).toBeInTheDocument();
    }
  });

  it("no usa una tabla que obligue a desplazarse a lo ancho", () => {
    const { container } = renderWithIntl(<SuenoPage locale="es" />);

    expect(container.querySelector("table")).toBeNull();
  });
});
