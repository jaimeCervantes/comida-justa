import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import LocationNotice from "./LocationNotice";

vi.mock("./actions", () => ({ shareLocation: vi.fn() }));

/** Niega el permiso, que es el camino que este componente tiene que tratar bien. */
function denyGeolocation(): void {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: (_ok: unknown, fail: () => void) => fail(),
    },
  });
}

describe("LocationNotice", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("explica que sin ubicación no hay cercanía, y ofrece darla", () => {
    renderWithIntl(<LocationNotice />);

    expect(screen.getByTestId("location-notice")).toHaveTextContent(
      /no podemos decirte qué tan cerca/i,
    );
    expect(screen.getByTestId("share-location")).toBeInTheDocument();
  });

  /* Quien dijo que no ya contestó: lo que se le ofrece es una razón, no un regaño. */
  it("al negarse, responde con un incentivo y deja la puerta abierta", async () => {
    denyGeolocation();
    renderWithIntl(<LocationNotice />);

    await userEvent.click(screen.getByTestId("share-location"));

    expect(screen.getByTestId("location-incentive")).toHaveTextContent(
      /dos cuadras/i,
    );
    // Y el botón sigue ahí, ahora invitando a compartirla de nuevo.
    expect(screen.getByTestId("share-location")).toBeInTheDocument();
  });

  it("le dice a quien no vende que vender exige tienda con ubicación", () => {
    renderWithIntl(<LocationNotice />);

    const cta = screen.getByTestId("seller-location-cta");

    expect(cta).toHaveTextContent(/abrir tu tienda/i);
    expect(cta.querySelector("a")).toHaveAttribute("href", "/cuenta");
  });

  it("no se lo repite a quien ya tiene tienda", () => {
    renderWithIntl(<LocationNotice showSellerCta={false} />);

    expect(screen.queryByTestId("seller-location-cta")).not.toBeInTheDocument();
    // El aviso de ubicación sí lo sigue viendo: eso no depende de tener tienda.
    expect(screen.getByTestId("location-notice")).toBeInTheDocument();
  });
});
