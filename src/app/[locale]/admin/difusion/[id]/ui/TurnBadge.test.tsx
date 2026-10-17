import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ChannelTurn } from "~/domain/outreach/rhythm";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import TurnBadge from "./TurnBadge";

/**
 * Escenario «El turno se ve como insignia, verde solo cuando ya le toca» de
 * `difusionEnGrupos.feature`. El tono se lee en `data-tone` y no en las clases: la prueba afirma la
 * decisión —verde o neutro—, no el color que hoy tiene cada token.
 */
describe("TurnBadge", () => {
  afterEach(cleanup);

  it.each<{ turn: ChannelTurn; seLee: string; tono: string }>([
    { turn: { due: true }, seLee: "Ya le toca", tono: "brand" },
    {
      turn: { due: false, inDays: 1 },
      seLee: "Todavía no: mañana",
      tono: "neutral",
    },
    {
      turn: { due: false, inDays: 4 },
      seLee: "Todavía no: en 4 días",
      tono: "neutral",
    },
  ])("«$seLee» va en tono $tono", ({ turn, seLee, tono }) => {
    renderWithIntl(<TurnBadge turn={turn} />);

    const badge = screen.getByTestId("outreach-channel-turn");
    expect(badge).toHaveTextContent(seLee);
    expect(badge).toHaveAttribute("data-tone", tono);
  });
});
