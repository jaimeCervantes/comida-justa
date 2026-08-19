import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import EventAttendanceWhatsapp from "./EventAttendanceWhatsapp";

const labels = {
  cta: "Avisar que quiero asistir",
};

function render({
  canNotify = true,
  href = "https://wa.me/522781092116?text=Hola",
}: {
  canNotify?: boolean;
  href?: string | null;
} = {}) {
  return renderWithIntl(
    <EventAttendanceWhatsapp
      href={href}
      isOffered={true}
      canNotify={canNotify}
      signInHref="/auth/signin?callbackUrl=%2Fmeditacion-guiada"
      labels={labels}
    />,
  );
}

describe("EventAttendanceWhatsapp", () => {
  it("con sesion abre WhatsApp", () => {
    render();

    const link = screen.getByTestId("event-attendance-whatsapp");

    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/522781092116?text=Hola",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("Avisar que quiero asistir");
  });

  it("sin sesion lleva a iniciar sesion y vuelve a la ficha", () => {
    render({ canNotify: false });

    const link = screen.getByTestId("event-attendance-signin");

    expect(link).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fmeditacion-guiada",
    );
    expect(link).toHaveTextContent("Avisar que quiero asistir");
    expect(screen.queryByTestId("event-attendance-whatsapp")).toBeNull();
  });

  it("sin sesion se ofrece aunque el numero se resuelva despues", () => {
    render({ canNotify: false, href: null });

    expect(screen.getByTestId("event-attendance-signin")).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Fmeditacion-guiada",
    );
  });

  it("con sesion no pinta nada si no hay numero al que avisar", () => {
    render({ href: null });

    expect(screen.queryByTestId("event-attendance-whatsapp")).toBeNull();
    expect(screen.queryByTestId("event-attendance-signin")).toBeNull();
  });

  it("no pinta nada cuando la publicacion no ofrece asistencia", () => {
    renderWithIntl(
      <EventAttendanceWhatsapp
        href="https://wa.me/522781092116?text=Hola"
        isOffered={false}
        canNotify={false}
        signInHref="/auth/signin?callbackUrl=%2Fjugo-verde"
        labels={labels}
      />,
    );

    expect(screen.queryByTestId("event-attendance-signin")).toBeNull();
    expect(screen.queryByTestId("event-attendance-whatsapp")).toBeNull();
  });
});
