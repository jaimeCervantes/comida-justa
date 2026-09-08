import { screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AlimentacionPage from "./AlimentacionPage";
import MenteEspirituPage from "./MenteEspirituPage";
import MovimientoPage from "./MovimientoPage";
import SuenoPage from "./SuenoPage";

/** La práctica es asíncrona y lee la sesión; aquí se comprueba el artículo que la envuelve. */
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

type PillarPage = ComponentType<{ locale: AppLocale }>;

/**
 * Las cuatro claves de pilar dentro de `pillarPages`, que además del objeto de cada pilar guarda
 * cadenas sueltas del héroe. Sin acotarla, `es.pillarPages[key]` sale como unión con `string` y no
 * tiene ni `heading` ni `subtitle`.
 */
type PillarCatalogKey = "sleep" | "nutrition" | "movement" | "mindSpirit";

/**
 * La tabla **no transcribe la redacción**: la lee del mismo catálogo que pinta la página.
 *
 * Escribía a mano título, entradilla e identidad de los cuatro, y eso la rompía en cada retoque de
 * texto: quitar el «1. » del título tumbó las cuatro de golpe sin que nada estuviera mal. Lo que
 * esta prueba afirma es la **estructura** —que los tres van dentro del mismo héroe, y que el héroe
 * lleva el color de su pilar—, no las palabras.
 */
describe.each(
  [
    {
      Page: SuenoPage as PillarPage,
      key: "sleep" as PillarCatalogKey,
      challenge: es.atomicSleepChallenge,
      theme: "linear-gradient(145deg,#17112f",
    },
    {
      Page: AlimentacionPage as PillarPage,
      key: "nutrition" as PillarCatalogKey,
      challenge: es.atomicChallenges.nutritionExperience,
      theme: "color-pillar-nutrition-solid",
    },
    {
      Page: MovimientoPage as PillarPage,
      key: "movement" as PillarCatalogKey,
      challenge: es.atomicChallenges.movementExperience,
      theme: "color-pillar-movement-solid",
    },
    {
      Page: MenteEspirituPage as PillarPage,
      key: "mindSpirit" as PillarCatalogKey,
      challenge: es.atomicChallenges.mindExperience,
      theme: "bg-pillar-mind-spirit-solid",
    },
  ].map((fila) => ({
    ...fila,
    heading: es.pillarPages[fila.key].heading,
    intro: es.pillarPages[fila.key].subtitle,
    identity: fila.challenge.identity,
  })),
)("$heading", ({ Page, heading, intro, identity, theme }) => {
  it("groups its title, introduction and identity in the themed hero", () => {
    const { container } = renderWithIntl(<Page locale="es" />);
    const title = screen.getByRole("heading", { level: 1, name: heading });
    const hero = title.closest("header");

    expect(hero?.className).toContain(theme);
    expect(within(hero as HTMLElement).getByText(intro)).toBeInTheDocument();
    expect(hero?.querySelector("blockquote")).toHaveTextContent(identity);
    expect(container.querySelector('a[href^="/habitos/"]')).toBeNull();
    expect(screen.getByTestId("pillar-practice")).toBeInTheDocument();
  });
});
