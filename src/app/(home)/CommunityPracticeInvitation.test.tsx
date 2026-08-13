import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import CommunityPracticeInvitation from "./CommunityPracticeInvitation";

describe("CommunityPracticeInvitation", () => {
  it("encabeza como hermana de las otras secciones, no compitiendo con el h1 del inicio", () => {
    renderWithIntl(<CommunityPracticeInvitation />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Practica algo que inspire a la comunidad",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  /* Es un enlace y no un botón a propósito: navega. Con `<button>` se perdería el clic derecho, el
     «abrir en pestaña nueva» y el anuncio de destino del lector de pantalla. */
  it("ofrece un enlace al hub de los cuatro pilares", () => {
    renderWithIntl(<CommunityPracticeInvitation />);

    expect(
      screen.getByRole("link", { name: "Elegir mi práctica" }),
    ).toHaveAttribute("href", "/pilares");
  });

  it("conserva el idioma activo en el destino, sin caer a la ruta española", () => {
    renderWithIntl(<CommunityPracticeInvitation />, { locale: "en" });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Practise something that inspires the community",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Choose my practice" }),
    ).toHaveAttribute("href", "/en/pillars");
  });

  /* El jardín consulta la base; esta invitación no recibe nada suyo. El día que la comunidad
     empiece en cero es justo cuando más hace falta que la puerta siga abierta. */
  it("se muestra sin recibir dato alguno del jardín", () => {
    renderWithIntl(<CommunityPracticeInvitation />);

    expect(
      screen.getByTestId("community-practice-invitation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/El jardín solo crece con repeticiones reales/),
    ).toBeInTheDocument();
  });
});
