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

  /*
   * Desde el slice 5 de `chrome.feature` la explicación no está dibujada —la barra del chrome tenía
   * que caber en un renglón— sino en el nombre accesible del bloque. Se sigue diciendo entera.
   */
  it("explica que sin ubicación no hay cercanía, y ofrece darla", () => {
    renderWithIntl(<LocationNotice />);

    expect(screen.getByTestId("location-notice")).toHaveAccessibleName(
      /no podemos decirte qué tan cerca/i,
    );
    expect(screen.getByTestId("share-location")).toBeInTheDocument();
  });

  /* Quien dijo que no ya contestó: lo que se le ofrece es una razón, no un regaño. */
  it("al negarse, responde con un incentivo y deja la puerta abierta", async () => {
    denyGeolocation();
    renderWithIntl(<LocationNotice />);

    await userEvent.click(screen.getByTestId("share-location"));

    expect(screen.getByTestId("location-notice")).toHaveAccessibleName(
      /dos cuadras/i,
    );
    // Y el botón sigue ahí, ahora invitando a compartirla de nuevo.
    expect(screen.getByTestId("share-location")).toBeInTheDocument();
  });

  /* Y a quien no se ha negado no se le adelanta el argumento: todavía no ha contestado. */
  it("no le suelta el incentivo a quien no ha dicho que no", () => {
    renderWithIntl(<LocationNotice />);

    expect(screen.getByTestId("location-notice")).not.toHaveAccessibleName(
      /dos cuadras/i,
    );
  });

  it("le dice a quien no vende que vender exige tienda con ubicación", () => {
    renderWithIntl(<LocationNotice />);

    const cta = screen.getByTestId("seller-location-cta");

    expect(cta).toHaveTextContent(/vendes/i);
    expect(cta.querySelector("a")).toHaveTextContent(/abre tu tienda/i);
    expect(cta.querySelector("a")).toHaveAttribute("href", "/cuenta");
  });

  /*
   * Lo que el slice 5 vino a comprar. Eran dos o tres párrafos en el chrome de **todas** las rutas;
   * lo que queda dibujado es lo que se pulsa. La explicación no se perdió — la afirman las pruebas
   * de arriba sobre el nombre accesible— pero ya no gasta renglones.
   */
  it("no dibuja la explicación: lo escrito es lo que se pulsa", () => {
    renderWithIntl(<LocationNotice />);

    const aviso = screen.getByTestId("location-notice");

    expect(aviso).not.toHaveTextContent(/no podemos decirte qué tan cerca/i);
    expect(aviso).toHaveTextContent(/ver a qué distancia está/i);
    expect(aviso).toHaveTextContent(/abre tu tienda/i);
  });

  it("no se lo repite a quien ya tiene tienda", () => {
    renderWithIntl(<LocationNotice showSellerCta={false} />);

    expect(screen.queryByTestId("seller-location-cta")).not.toBeInTheDocument();
    // El aviso de ubicación sí lo sigue viendo: eso no depende de tener tienda.
    expect(screen.getByTestId("location-notice")).toBeInTheDocument();
  });
});
