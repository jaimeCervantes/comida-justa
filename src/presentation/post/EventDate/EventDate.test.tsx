import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import EventDate from "./EventDate";

const RODADA = {
  kind: "evento",
  startsAt: "2026-08-22T06:00:00Z",
  endsAt: "2026-08-22T08:00:00Z",
};

/** El estado sale del reloj, así que la prueba mueve el reloj. */
function at(iso: string) {
  vi.setSystemTime(new Date(iso));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EventDate", () => {
  it.each([
    ["2026-08-21T20:00:00Z", "proximo"],
    ["2026-08-22T07:00:00Z", "en_curso"],
    ["2026-08-23T09:00:00Z", "pasado"],
  ])("a las %s pinta el estado %s", (ahora, esperado) => {
    at(ahora);
    render(<EventDate {...RODADA} />);

    expect(screen.getByTestId("event-date")).toHaveAttribute(
      "data-state",
      esperado,
    );
  });

  /* La fecha va en un `<time datetime>` para que sea legible por máquina: es lo que permite que un
     lector de pantalla y un buscador la entiendan sin adivinar el formato del idioma. */
  it("la fecha viaja también en formato máquina", () => {
    at("2026-08-21T20:00:00Z");
    render(<EventDate {...RODADA} />);

    const time = screen.getByTestId("event-date").querySelector("time");

    expect(time).toHaveAttribute("dateTime", "2026-08-22T06:00:00.000Z");
  });

  /* La regla de cuándo aplica vive en el dominio, igual que en `SoldOutBadge`. */
  it("no pinta nada en lo que no es un evento", () => {
    at("2026-08-21T20:00:00Z");
    render(<EventDate kind="producto" startsAt={RODADA.startsAt} />);

    expect(screen.queryByTestId("event-date")).not.toBeInTheDocument();
  });

  it("no pinta nada en un evento sin fecha", () => {
    at("2026-08-21T20:00:00Z");
    render(<EventDate kind="evento" startsAt={null} />);

    expect(screen.queryByTestId("event-date")).not.toBeInTheDocument();
  });

  /* Sin hora de fin, el evento caduca en su hora de inicio. */
  it("sin hora de fin, al minuto siguiente ya pasó", () => {
    at("2026-08-22T06:01:00Z");
    render(<EventDate kind="evento" startsAt={RODADA.startsAt} />);

    expect(screen.getByTestId("event-date")).toHaveAttribute(
      "data-state",
      "pasado",
    );
  });
});
