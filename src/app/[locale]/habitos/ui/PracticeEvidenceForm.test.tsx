import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import PracticeEvidenceForm from "./PracticeEvidenceForm";

const action = vi.fn(async () => ({
  errors: {},
  success: false,
  slug: null,
}));

function renderForm(): void {
  render(
    <PracticeEvidenceForm
      action={action}
      practice={{
        key: "sleep-sunset-light",
        title: "Penumbra total",
        summary: "Baja luces y pantallas antes de dormir.",
        cue: "Al cerrar la noche",
        minimum: "Apaga una pantalla",
        effortMinutes: 2,
        costLevel: 0,
        pillars: ["sleep"],
        studyCount: 2,
        challengeKey: "sleep-v1",
      }}
      pillarLabel="Sueño"
    />,
  );
}

describe("PracticeEvidenceForm", () => {
  it("nace configurado por la práctica y el pilar", () => {
    renderForm();

    const form = screen.getByTestId("practice-evidence-form");

    expect(form).toHaveTextContent("Penumbra total");
    expect(form).toHaveTextContent("Sueño");
    expect(form).toHaveTextContent("Baja luces y pantallas antes de dormir.");
  });

  it("no pide campos del formulario comercial de publicar", () => {
    renderForm();

    expect(screen.queryByText(/tipo de publicación/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/precio/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fecha|cuándo empieza/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/duración/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/teléfono/i)).not.toBeInTheDocument();
  });

  it("envía sólo la clave de práctica, evidencia y nota opcional", () => {
    renderForm();

    expect(screen.getByDisplayValue("sleep-sunset-light")).toHaveAttribute(
      "name",
      "practiceKey",
    );
    expect(
      screen.getByLabelText("Foto o video de tu práctica"),
    ).toHaveAttribute("name", "");
    expect(screen.getByLabelText("Nota opcional")).toHaveAttribute(
      "name",
      "note",
    );
  });
});
