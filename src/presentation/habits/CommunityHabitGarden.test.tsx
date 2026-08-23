import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import CommunityHabitGarden from "./CommunityHabitGarden";
import type { CommunitySectionVariant } from "./communitySectionVariant";

/**
 * El jardín es un Server Component: `getTranslations` no tiene configuración que leer fuera de una
 * petición de Next. Se sustituye por un traductor armado con el catálogo **real**, no uno de
 * mentira, para que borrar una clave rompa la prueba —el mismo criterio que `renderWithIntl`—.
 */
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("~/i18n/messages/es.json")).default;

  return {
    getTranslations: async (namespace: "habitCommunity") =>
      createTranslator({ locale: "es", messages, namespace }),
  };
});

const GARDEN: CommunityGarden = {
  sleep: 12,
  nutrition: 8,
  movement: 5,
  mind: 3,
  total: 28,
  weeklyPractitioners: 4,
};

describe("CommunityHabitGarden", () => {
  it("relata el jardín completo cuando no se pide otra variante", async () => {
    await renderGarden();

    expect(
      screen.getByRole("heading", { name: "El jardín de los cuatro pilares" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/28 repeticiones compartidas alimentan este jardín/),
    ).toBeInTheDocument();
    expect(screen.getByText(/nunca se muestran nombres/)).toBeInTheDocument();
  });

  it("deja solo los canteros en la variante compacta", async () => {
    await renderGarden("compact");

    expect(
      screen.queryByText("El jardín de los cuatro pilares"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/repeticiones compartidas alimentan/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/nunca se muestran nombres/),
    ).not.toBeInTheDocument();
  });

  it("nombra la sección compacta con la actividad agregada, sin dejarla sin encabezado", async () => {
    await renderGarden("compact");

    expect(
      screen.getByRole("heading", { name: "Actividad agregada" }),
    ).toBeInTheDocument();
  });

  /**
   * Los canteros cuentan la historia y el pulso cuenta la semana: son dos lecturas, no una que
   * sustituye a la otra. Que 28 y 4 convivan en la misma pantalla es justamente lo que se afirma.
   */
  it("dice cuánta gente practica esta semana sin borrar lo ya cultivado", async () => {
    await renderGarden();

    expect(
      screen.getByText("4 personas están practicando esta semana."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/28 repeticiones compartidas alimentan este jardín/),
    ).toBeInTheDocument();
  });

  it("habla en singular de una sola persona", async () => {
    await renderGarden(undefined, 1);

    expect(
      screen.getByText("1 persona está practicando esta semana."),
    ).toBeInTheDocument();
  });

  it("invita a empezar la semana en vez de fingir participantes", async () => {
    await renderGarden(undefined, 0);

    expect(screen.getByText(/Puedes ser quien la empiece/)).toBeInTheDocument();
    expect(screen.queryByText(/están practicando/)).not.toBeInTheDocument();
  });

  it.each(["full", "compact"] as const)(
    "muestra las repeticiones de los cuatro pilares en la variante %s",
    async (variant) => {
      await renderGarden(variant);

      expect(
        ["sleep", "nutrition", "movement", "mind"].map(
          (pillar) =>
            document.querySelector(`[data-pillar="${pillar}"] strong`)
              ?.textContent,
        ),
      ).toEqual(["12", "8", "5", "3"]);
    },
  );
});

/**
 * Al Server Component se le llama como función y se pinta el árbol que devuelve; el `<div>` es lo
 * que convierte ese `ReactNode` en algo renderizable sin castear el tipo de retorno.
 */
async function renderGarden(
  variant?: CommunitySectionVariant,
  weeklyPractitioners = GARDEN.weeklyPractitioners,
): Promise<void> {
  render(
    <div>
      {
        await CommunityHabitGarden({
          garden: { ...GARDEN, weeklyPractitioners },
          variant,
        })
      }
    </div>,
  );
}
