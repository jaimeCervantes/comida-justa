import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AccountHeader from "./AccountHeader";

const STORE = "Panadería La Luz";
const HANDLE = "panaderia-la-luz";
const USERNAME = "jaime-cervantes";

function header(): HTMLElement {
  return screen.getByTestId("account-identity");
}

describe("AccountHeader", () => {
  it("gasta el único título principal en nombrar la tienda", () => {
    renderWithIntl(
      <AccountHeader
        storeName={STORE}
        logoUrl={null}
        handle={HANDLE}
        username={USERNAME}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(STORE);
  });

  it("enseña las dos direcciones en camino corto, cada una con su botón de repartir", () => {
    renderWithIntl(
      <AccountHeader
        storeName={STORE}
        logoUrl={null}
        handle={HANDLE}
        username={USERNAME}
      />,
    );

    for (const [path, shareTestId] of [
      [`/tienda/${HANDLE}`, "share-store-trigger"],
      [`/u/${USERNAME}`, "share-profile-trigger"],
    ]) {
      const enlace = within(header()).getByRole("link", { name: path });

      /* El camino corto y no la dirección absoluta: es lo que deja sitio al botón de al lado. */
      expect(enlace).toHaveTextContent(new RegExp(`^${path}$`));
      /* Y se abre aparte, para no perder la cuenta a medio configurar. */
      expect(enlace).toHaveAttribute("target", "_blank");
      expect(within(header()).getByTestId(shareTestId)).toBeInTheDocument();
    }
  });

  it("cae a la inicial de la tienda cuando todavía no hay logo", () => {
    renderWithIntl(
      <AccountHeader
        storeName={STORE}
        logoUrl={null}
        handle={HANDLE}
        username={null}
      />,
    );

    expect(within(header()).getByText("P")).toBeInTheDocument();
    expect(within(header()).queryByRole("img")).not.toBeInTheDocument();
    expect(header().querySelector("img")).toBeNull();
  });

  it("no ofrece la dirección personal mientras no esté reservada", () => {
    renderWithIntl(
      <AccountHeader
        storeName={STORE}
        logoUrl={null}
        handle={HANDLE}
        username={null}
      />,
    );

    expect(
      within(header()).queryByTestId("share-profile-trigger"),
    ).not.toBeInTheDocument();
  });

  it("dice que no hay página pública en vez de callarse, cuando la tienda no tiene dirección", () => {
    // Las tiendas que creó el chatbot no tienen `handle`.
    renderWithIntl(
      <AccountHeader
        storeName={STORE}
        logoUrl={null}
        handle={null}
        username={null}
      />,
    );

    expect(
      within(header()).getByText(es.account.storeCardNoPublicPage),
    ).toBeInTheDocument();
  });

  describe("cuando todavía no hay tienda abierta", () => {
    it("titula «Mi cuenta», que es lo único que puede nombrar", () => {
      renderWithIntl(
        <AccountHeader
          storeName={null}
          logoUrl={null}
          handle={null}
          username={null}
        />,
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        es.account.identityHeadingNoStore,
      );
    });

    it("no pinta un logo de una tienda que no existe", () => {
      renderWithIntl(
        <AccountHeader
          storeName={null}
          logoUrl={null}
          handle={null}
          username={null}
        />,
      );

      expect(header().querySelector("img")).toBeNull();
      expect(
        within(header()).queryByText(es.account.storeCardNoPublicPage),
      ).not.toBeInTheDocument();
    });

    it("sigue repartiendo la dirección personal si ya la reservó", () => {
      renderWithIntl(
        <AccountHeader
          storeName={null}
          logoUrl={null}
          handle={null}
          username={USERNAME}
        />,
      );

      expect(
        within(header()).getByRole("link", { name: `/u/${USERNAME}` }),
      ).toBeInTheDocument();
    });
  });
});
