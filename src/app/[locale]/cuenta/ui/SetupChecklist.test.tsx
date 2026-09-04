import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  type AccountSetupSnapshot,
  readAccountSetup,
} from "~/domain/entities/seller/accountSetup";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SetupChecklist from "./SetupChecklist";

const EMPTY: AccountSetupSnapshot = {
  storeName: null,
  username: null,
  logoUrl: null,
  description: null,
  branchCoordinates: [],
};

const COMPLETE: AccountSetupSnapshot = {
  storeName: "Panadería La Luz",
  username: "jaime-cervantes",
  logoUrl: "https://cdn.test/logo.webp",
  description: "Pan de masa madre horneado cada mañana.",
  branchCoordinates: [{ latitude: 18.6013, longitude: -96.7089 }],
};

function renderFor(snapshot: AccountSetupSnapshot): void {
  renderWithIntl(<SetupChecklist setup={readAccountSetup(snapshot)} />);
}

/** El renglón de un paso, localizado por su rótulo escrito. */
function step(label: string): HTMLElement {
  const row = screen.getByText(label).closest("li");

  if (!row) throw new Error(`El paso «${label}» no tiene renglón`);

  return row;
}

describe("SetupChecklist", () => {
  it("no se pinta cuando no falta nada: no hay nada que ofrecer", () => {
    renderFor(COMPLETE);

    expect(screen.queryByTestId("account-setup")).not.toBeInTheDocument();
  });

  it("escribe el avance, en vez de dejarlo solo en la barra", () => {
    // Tienda, dirección personal y descripción: tres de cinco.
    renderFor({ ...COMPLETE, logoUrl: null, branchCoordinates: [] });

    expect(screen.getByTestId("account-setup")).toHaveTextContent(
      es.account.setupSummary.replace("{done}", "3").replace("{total}", "5"),
    );
  });

  it("enumera los cinco pasos en el orden acordado, falte lo que falte", () => {
    renderFor(EMPTY);

    const labels = screen
      .getAllByTestId("setup-checklist-item")
      .map((row) => row.textContent ?? "");

    expect(labels).toHaveLength(5);
    expect(labels[0]).toContain(es.account.setupStepStore);
    expect(labels[1]).toContain(es.account.setupStepUsername);
    expect(labels[2]).toContain(es.account.setupStepLogo);
    expect(labels[3]).toContain(es.account.setupStepDescription);
    expect(labels[4]).toContain(es.account.setupStepBranchLocation);
  });

  describe("un paso cumplido ya no pide nada", () => {
    it("se marca como listo y se queda sin enlace", () => {
      renderFor({ ...COMPLETE, logoUrl: null });
      const cumplido = step(es.account.setupStepStore);

      expect(within(cumplido).getByText(es.account.setupDone)).toBeVisible();
      expect(within(cumplido).queryByRole("link")).not.toBeInTheDocument();
    });

    it("tampoco repite el consejo de por qué convenía", () => {
      renderFor({ ...COMPLETE, logoUrl: null });

      expect(
        screen.queryByText(es.account.setupStepStoreHint),
      ).not.toBeInTheDocument();
    });
  });

  describe("un paso pendiente dice qué gana y a dónde ir", () => {
    it("lleva su consejo y un enlace al bloque que lo arregla", () => {
      renderFor({ ...COMPLETE, logoUrl: null });
      const pendiente = step(es.account.setupStepLogo);

      expect(
        within(pendiente).getByText(es.account.setupPending),
      ).toBeVisible();
      expect(
        within(pendiente).getByText(es.account.setupStepLogoHint),
      ).toBeVisible();
      expect(
        within(pendiente).getByRole("link", { name: es.account.setupGo }),
      ).toHaveAttribute("href", expect.stringContaining("#"));
    });

    it("el enlace apunta al ancla del bloque, no al principio de la página", () => {
      renderFor({ ...COMPLETE, branchCoordinates: [] });

      expect(
        within(step(es.account.setupStepBranchLocation)).getByRole("link"),
      ).toHaveAttribute("href", "/cuenta#agregar-sucursal");
    });
  });
});
