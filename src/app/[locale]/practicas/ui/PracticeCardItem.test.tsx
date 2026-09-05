import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PracticeCardItem from "./PracticeCardItem";

/** Datos reales de la semilla: la descarga mental es la práctica con la evidencia más clara. */
function practice(overrides: Partial<PracticeCard> = {}): PracticeCard {
  return {
    key: "sleep-mental-unload",
    title: "La descarga mental",
    summary:
      "Escribir cinco minutos lo que queda pendiente hace dormirse antes que escribir lo que ya se hizo.",
    cue: "Justo antes de lavarte los dientes para acostarte.",
    minimum: "Tres renglones bastan.",
    effortMinutes: 5,
    costLevel: 0,
    pillars: ["sleep"],
    studyCount: 1,
    challengeKey: null,
    ...overrides,
  };
}

/**
 * Los tres estados que puede tener una tarjeta: sin sesión, con sesión y sin llevarla, y llevándola.
 * Se envuelve el render para no repetir cuatro props en cada escenario.
 */
function render(
  practice: PracticeCard,
  {
    adopted = false,
    signedIn = true,
  }: { adopted?: boolean; signedIn?: boolean } = {},
) {
  return renderWithIntl(
    <PracticeCardItem
      practice={practice}
      pillar={practice.pillars[0]}
      adopted={adopted}
      signedIn={signedIn}
      signInHref="/auth/signin?callbackUrl=%2Fpracticas"
      action={async () => {}}
    />,
  );
}

function card(): HTMLElement {
  return screen.getByTestId("practice-card");
}

describe("la tarjeta de una práctica", () => {
  it("enseña el ancla antes que el título: lo que la vuelve obvia es el momento", () => {
    render(practice());

    const texto = card().textContent ?? "";
    expect(texto.indexOf("Justo antes de lavarte")).toBeLessThan(
      texto.indexOf("La descarga mental"),
    );
  });

  it("dice lo que basta para que cuente", () => {
    render(practice());

    expect(
      within(card()).getByText(/Tres renglones bastan/),
    ).toBeInTheDocument();
  });

  it("una práctica sin estudio lo dice, en vez de callarlo", () => {
    /* Cero se enseña igual que cinco. Esconderlo dejaría creer que todas están respaldadas por
       igual, que es la autoridad prestada que este catálogo deshizo. */
    render(practice({ key: "sleep-paper-book", studyCount: 0 }));

    expect(screen.getByTestId("practice-evidence")).toHaveTextContent(
      /Sin estudio/,
    );
  });

  it("anuncia los otros pilares a los que sirve", () => {
    render(
      practice({
        key: "mind-slow-breathing",
        pillars: ["mindSpirit", "sleep"],
      }),
    );

    expect(within(card()).getByText(/También sirve a/)).toBeInTheDocument();
  });

  it("no anuncia puentes cuando la práctica sirve a un solo pilar", () => {
    render(practice());

    expect(
      within(card()).queryByText(/También sirve a/),
    ).not.toBeInTheDocument();
  });

  it("una práctica sin ancla todavía escrita no pinta la etiqueta vacía", () => {
    render(practice({ cue: null }));

    expect(within(card()).queryByText("Cuándo")).not.toBeInTheDocument();
  });

  it("marca la práctica que además es el ritual del pilar", () => {
    render(practice({ challengeKey: "sleep-evening-to-morning-v1" }));

    expect(
      within(card()).getByText(/Es el ritual del pilar/),
    ).toBeInTheDocument();
  });
});

describe("empezar y dejar una práctica", () => {
  it("sin sesión invita a entrar, sin esconder la práctica", () => {
    /* El catálogo es público: entrar sirve para llevar las tuyas, no para leerlo. */
    render(practice(), { signedIn: false });

    expect(
      within(card()).getByRole("link", { name: /Entrar para empezarla/ }),
    ).toHaveAttribute("href", expect.stringContaining("callbackUrl"));
    expect(within(card()).getByText("La descarga mental")).toBeInTheDocument();
  });

  it("con sesión y sin llevarla, ofrece empezarla", () => {
    render(practice());

    expect(screen.getByTestId("practice-toggle")).toHaveTextContent(
      /Empezar esta práctica/,
    );
    expect(screen.queryByTestId("practice-adopted")).not.toBeInTheDocument();
  });

  it("llevándola, lo dice y ofrece dejarla con el mismo peso", () => {
    /* Dejar no se esconde detrás de un menú: es información, y un botón difícil de encontrar sólo
       consigue que la gente deje de practicar sin decirlo. */
    render(practice(), { adopted: true });

    expect(screen.getByTestId("practice-adopted")).toHaveTextContent(
      /La estás practicando/,
    );
    expect(screen.getByTestId("practice-toggle")).toHaveTextContent(
      /Dejar de practicarla/,
    );
  });

  it("manda la clave de la práctica y la intención, no el identificador de nadie", () => {
    // Quién es la persona lo resuelve el servidor desde la sesión, nunca el formulario.
    render(practice(), { adopted: true });
    const form = screen.getByTestId("practice-toggle").closest("form");

    expect(form?.querySelector('input[name="practiceKey"]')).toHaveValue(
      "sleep-mental-unload",
    );
    expect(form?.querySelector('input[name="intent"]')).toHaveValue("stop");
    expect(form?.querySelector('input[name="userId"]')).toBeNull();
  });
});
