import { screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AlimentacionPage from "./AlimentacionPage";
import MenteEspirituPage from "./MenteEspirituPage";
import MovimientoPage from "./MovimientoPage";

vi.mock("./CuratedPracticeSection", () => ({
  default: () => <section data-testid="curated-practice" />,
}));

type PillarPage = ComponentType<{ locale: AppLocale }>;

describe.each([
  {
    Page: AlimentacionPage as PillarPage,
    heading: "2. Alimentación natural y nutritiva",
    intro: "Reconectando con el origen y la comida real.",
    identity: "Soy una persona que hace fácil elegir comida real",
    theme: "color-pillar-nutrition-solid",
  },
  {
    Page: MovimientoPage as PillarPage,
    heading: "3. Movimiento y ejercicio",
    intro: "Combatiendo el sedentarismo en la vida diaria.",
    identity: "Soy una persona que empieza a moverse",
    theme: "color-pillar-movement-solid",
  },
  {
    Page: MenteEspirituPage as PillarPage,
    heading: "4. Emociones, Mente, Espíritu y Comunidad",
    intro: "Reconectando con nosotros mismos y nuestra tribu.",
    identity: "Soy una persona que cultiva vínculos reales",
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
    expect(screen.getByTestId("curated-practice")).toBeInTheDocument();
  });
});
