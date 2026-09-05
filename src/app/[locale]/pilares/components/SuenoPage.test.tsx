import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SuenoPage from "./SuenoPage";

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

/* Y el catálogo consulta `pillar_themes`: cuarta frontera asíncrona. Lo que la tarjeta promete se
   comprueba en `PillarCatalog.test.tsx`, con temas fijos. */
vi.mock("./PillarCatalogSection", () => ({
  default: ({ heading }: { heading: string }) => (
    <section data-testid="pillar-catalog">
      <h2>{heading}</h2>
    </section>
  ),
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

/**
 * Los destinos, el color y el idioma de los puentes se comprueban para los cuatro pilares a la vez
 * en `PillarBridges.test.tsx`. Aquí queda lo que es propio de Sueño: qué dice cada puente.
 */
describe("los puentes con los otros pilares", () => {
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
});

describe("la página entera", () => {
  it("no usa una tabla que obligue a desplazarse a lo ancho", () => {
    const { container } = renderWithIntl(<SuenoPage locale="es" />);

    expect(container.querySelector("table")).toBeNull();
  });
});
