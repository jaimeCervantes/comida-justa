import { screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AlimentacionPage from "./AlimentacionPage";
import MenteEspirituPage from "./MenteEspirituPage";
import MovimientoPage from "./MovimientoPage";
import SuenoPage from "./SuenoPage";

/** La práctica es asíncrona y lee la sesión; aquí solo se comprueban los puentes. */
vi.mock("./PillarPractice", () => ({
  default: () => <section data-testid="pillar-practice" />,
}));

/* Y la seccion local lee la base y la sesion: misma frontera, mismo corte. */
vi.mock("./PillarLocal", () => ({
  default: () => <section data-testid="pillar-local" />,
}));

type PillarPage = ComponentType<{ locale: AppLocale }>;

const ES_HEADING = "Cómo se conecta con los otros tres pilares";
const EN_HEADING = "How it connects with the other three pillars";

function bridgesOf(heading: string): HTMLElement {
  const section = screen
    .getByRole("heading", { name: heading })
    .closest("section");
  if (!section) throw new Error(`«${heading}» no vive dentro de una sección`);
  return section;
}

/**
 * Los cuatro pilares muestran a dónde llevan los otros tres, y los enlaces son de verdad.
 *
 * La prueba recorre las cuatro páginas en vez de probar `PillarBridges` con datos inventados: lo
 * que puede romperse aquí no es la tarjeta —que es trivial— sino que una página se quede sin su
 * sección, o que un pilar enlace al destino equivocado por copiar el bloque de otro.
 */
describe.each([
  {
    name: "Sueño",
    Page: SuenoPage as PillarPage,
    heading: "Cómo llegan aquí los otros tres pilares",
    destinations: [
      "/pilares/alimentacion",
      "/pilares/movimiento",
      "/pilares/mente-espiritu",
    ],
  },
  {
    name: "Alimentación",
    Page: AlimentacionPage as PillarPage,
    heading: ES_HEADING,
    destinations: [
      "/pilares/sueno",
      "/pilares/movimiento",
      "/pilares/mente-espiritu",
    ],
  },
  {
    name: "Movimiento",
    Page: MovimientoPage as PillarPage,
    heading: ES_HEADING,
    destinations: [
      "/pilares/sueno",
      "/pilares/alimentacion",
      "/pilares/mente-espiritu",
    ],
  },
  {
    name: "Mente y Espíritu",
    Page: MenteEspirituPage as PillarPage,
    heading: ES_HEADING,
    destinations: [
      "/pilares/sueno",
      "/pilares/alimentacion",
      "/pilares/movimiento",
    ],
  },
])("los puentes de $name", ({ Page, heading, destinations }) => {
  it("enlaza a los otros tres pilares y nunca a sí mismo", () => {
    renderWithIntl(<Page locale="es" />);
    const bridges = bridgesOf(heading);

    expect(
      within(bridges)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(destinations);
  });

  it("pinta cada tarjeta con el color de su destino, no con el suyo", () => {
    renderWithIntl(<Page locale="es" />);
    const cards = within(bridgesOf(heading)).getAllByRole("listitem");

    const tokens = destinations.map((destination) =>
      destination.replace("/pilares/", "").replace("mente-espiritu", "mind"),
    );
    for (const [index, card] of cards.entries()) {
      const expected = {
        sueno: "sleep",
        alimentacion: "nutrition",
        movimiento: "movement",
        mind: "mind-spirit",
      }[tokens[index] as string];

      expect(card.className).toContain(`pillar-${expected}`);
    }
  });
});

describe("los puentes en inglés", () => {
  it("conservan el idioma en el destino", () => {
    renderWithIntl(<AlimentacionPage locale="en" />, { locale: "en" });

    expect(
      within(bridgesOf(EN_HEADING))
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/en/pillars/sueno",
      "/en/pillars/movimiento",
      "/en/pillars/mente-espiritu",
    ]);
  });
});
