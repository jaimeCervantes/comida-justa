import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AccountBackBar from "./AccountBackBar";

describe("AccountBackBar", () => {
  /* Lo que no había: «Mis publicaciones» llevaba al perfil público y ahí se acababa la sección. */
  it("ofrece el camino de vuelta a la cuenta", () => {
    renderWithIntl(<AccountBackBar current={es.nav.myPublications} />);

    expect(
      screen.getByRole("link", { name: es.nav.myAccount }),
    ).toHaveAttribute("href", "/cuenta");
  });

  it("y dice en qué parte de la cuenta estás", () => {
    renderWithIntl(<AccountBackBar current={es.nav.myPublications} />);

    expect(screen.getByTestId("account-back-bar")).toHaveTextContent(
      es.nav.myPublications,
    );
  });

  /*
   * Dónde estás no es un sitio al que ir. Cuando era un enlace más, el hilo tenía dos destinos y
   * uno de ellos recargaba la página en la que ya estabas.
   */
  it("y eso no es un enlace: es dónde estás", () => {
    renderWithIntl(<AccountBackBar current={es.nav.myPublications} />);

    expect(
      screen.queryByRole("link", { name: es.nav.myPublications }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("account-back-bar").querySelectorAll("a"),
    ).toHaveLength(1);
  });
});
