import { screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
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

type PillarPage = ComponentType<{ locale: AppLocale }>;

describe.each([
  {
    Page: SuenoPage as PillarPage,
    heading: "1. Sueño y descanso profundo",
    intro: "Volver a dormir al ritmo de la luz, no al de las pantallas.",
    identity:
      "Soy una persona que respeta los ritmos naturales de su cuerpo y se regala un descanso profundo y reparador cada noche",
    theme: "linear-gradient(145deg,#17112f",
  },
  {
    Page: AlimentacionPage as PillarPage,
    heading: "2. Alimentación natural, nutritiva y local",
    intro: "Reconectando con el origen, la temporada y quien la cultiva.",
    identity:
      "Soy una persona que hace fácil elegir comida real, fresca y de origen local",
    theme: "color-pillar-nutrition-solid",
  },
  {
    Page: MovimientoPage as PillarPage,
    heading: "3. Movimiento natural, local y comunitario",
    intro:
      "Recuperar el cuerpo en la calle, el sendero y la cancha del barrio.",
    identity:
      "Soy una persona que se mueve de forma natural y reconecta con su entorno y comunidad todos los días",
    theme: "color-pillar-movement-solid",
  },
  {
    Page: MenteEspirituPage as PillarPage,
    heading: "4. Mente, espíritu y comunidad cercana",
    intro: "Recuperar el silencio, la presencia y la gente que vive cerca.",
    identity:
      "Soy una persona que cultiva la paz interior, la presencia y lazos sólidos con su comunidad todos los días",
    theme: "bg-pillar-mind-spirit-solid",
  },
])("$heading", ({ Page, heading, intro, identity, theme }) => {
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
