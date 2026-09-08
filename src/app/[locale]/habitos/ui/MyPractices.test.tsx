import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import MyPractices from "./MyPractices";

function practice(overrides: Partial<PracticeCard> = {}): PracticeCard {
  return {
    key: "sleep-mental-unload",
    title: "La descarga mental",
    summary:
      "Escribir cinco minutos lo que queda pendiente hace dormirse antes.",
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

describe("mis prácticas", () => {
  it("enseña el ancla y no la promesa", () => {
    /* Quien vuelve aquí no necesita que le convenzan otra vez de que ayuda: necesita acordarse de
       cuándo lo hace. La promesa vive en el catálogo, que es donde se elige. */
    renderWithIntl(<MyPractices practices={[practice()]} />);
    const item = screen.getByTestId("my-practices");

    expect(
      within(item).getByText(/Justo antes de lavarte/),
    ).toBeInTheDocument();
    expect(
      within(item).queryByText(/Escribir cinco minutos/),
    ).not.toBeInTheDocument();
  });

  it("sin ninguna, invita al catálogo en vez de desaparecer", () => {
    // Una sección que se esconde deja a quien no ha empezado sin saber que existe.
    renderWithIntl(<MyPractices practices={[]} />);

    expect(screen.getByTestId("my-practices")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /catálogo de prácticas/i }),
    ).toBeInTheDocument();
  });

  it("lista una entrada por práctica, identificada por su clave", () => {
    renderWithIntl(
      <MyPractices
        practices={[
          practice(),
          practice({
            key: "mind-gratitude",
            title: "Cerrar el día con gratitud",
            pillars: ["mindSpirit"],
          }),
        ]}
      />,
    );

    expect(
      screen.getByTestId("my-practices").querySelectorAll("[data-practice]"),
    ).toHaveLength(2);
  });

  it("muestra el mínimo y permite marcar una práctica pendiente", () => {
    renderWithIntl(
      <MyPractices practices={[practice()]} markAction={async () => {}} />,
    );
    const item = screen.getByTestId("my-practices");

    expect(within(item).getByText(/Tres renglones bastan/)).toBeVisible();
    expect(within(item).getByTestId("practice-mark")).toHaveTextContent(
      "Lo hice hoy",
    );
  });

  it("muestra una práctica como privada hasta que la persona decide compartirla", () => {
    renderWithIntl(
      <MyPractices practices={[practice()]} sharingAction={async () => {}} />,
    );
    const item = screen.getByTestId("my-practices");

    expect(
      within(item).getByTestId("practice-sharing-status"),
    ).toHaveTextContent("Privada");
    expect(within(item).getByTestId("practice-sharing-toggle")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("muestra una práctica compartida como visible y permite retirarla", () => {
    renderWithIntl(
      <MyPractices
        practices={[practice()]}
        sharedPracticeKeys={new Set(["sleep-mental-unload"])}
        sharingAction={async () => {}}
      />,
    );
    const item = screen.getByTestId("my-practices");

    expect(
      within(item).getByTestId("practice-sharing-status"),
    ).toHaveTextContent("Compartida");
    expect(within(item).getByTestId("practice-sharing-toggle")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("si el pilar ya cuenta hoy, lo explica y no ofrece otro aporte", () => {
    renderWithIntl(
      <MyPractices
        practices={[practice(), practice({ key: "sleep-dark-room" })]}
        doneTodayPillars={new Set<PillarKey>(["sleep"])}
        markAction={async () => {}}
      />,
    );

    expect(screen.queryAllByTestId("practice-mark")).toHaveLength(0);
    expect(screen.getAllByTestId("practice-done-today")).toHaveLength(2);
  });
});
