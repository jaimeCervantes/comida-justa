import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import UserMenu from "./UserMenu";

/** Lo que en producción llega ya renderizado desde el servidor. */
const AVATAR = <span data-testid="avatar-slot">avatar</span>;
const SIGN_OUT = <button type="button">{es.nav.signOut}</button>;

function renderMenu({
  isAdmin = false,
  storeHandle = null,
  username = null,
}: {
  isAdmin?: boolean;
  storeHandle?: string | null;
  username?: string | null;
} = {}) {
  return renderWithIntl(
    <UserMenu
      avatar={AVATAR}
      signOut={SIGN_OUT}
      userName="Jaime"
      isAdmin={isAdmin}
      storeHandle={storeHandle}
      username={username}
    />,
  );
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: es.nav.openUserMenu }));
  return user;
}

describe("When a signed-in visitor opens the avatar menu", () => {
  it("Then nothing is shown until it is opened", () => {
    renderMenu();

    expect(screen.getByTestId("avatar-slot")).toBeInTheDocument();
    expect(screen.queryByText(es.nav.myAccount)).not.toBeInTheDocument();
  });

  it("Then it offers the account and signing out", async () => {
    renderMenu();
    await openMenu();

    expect(screen.getByText(es.nav.myAccount)).toBeInTheDocument();
    expect(screen.getByText(es.nav.signOut)).toBeInTheDocument();
  });

  it("Then it shows whose account it is", async () => {
    renderMenu();
    await openMenu();

    expect(screen.getByText("Jaime")).toBeInTheDocument();
  });

  /* El gate de verdad está en cada página de `/admin`; esto solo evita ofrecerle a alguien una
     puerta que le va a responder que no. */
  it("Then someone who is not an admin is not offered the internal tools", async () => {
    renderMenu({ isAdmin: false });
    await openMenu();

    expect(screen.queryByText(es.nav.catalog)).not.toBeInTheDocument();
    expect(screen.queryByText(es.nav.report)).not.toBeInTheDocument();
  });

  it("Then an admin is offered the catalogue and the report", async () => {
    renderMenu({ isAdmin: true });
    await openMenu();

    expect(screen.getByText(es.nav.catalog)).toBeInTheDocument();
    expect(screen.getByText(es.nav.report)).toBeInTheDocument();
  });

  it("Then every entry points where it says", async () => {
    renderMenu({ isAdmin: true });
    await openMenu();

    const hrefFor = (label: string) =>
      screen.getByText(label).closest("a")?.getAttribute("href");

    expect(hrefFor(es.nav.myAccount)).toBe("/cuenta");
    expect(hrefFor(es.nav.catalog)).toBe("/admin/catalogo");
    expect(hrefFor(es.nav.report)).toBe("/admin/productos");
  });
});

describe("When the avatar menu offers what belongs to the visitor", () => {
  /* La corrida de escritorio del escenario "El menú solo ofrece lo que existe". De los 21 usuarios
     de la base, 20 están en la última fila: no tener ni tienda ni dirección es el caso común. */
  it.each([
    ["con tienda y con perfil", "hazlo-sano", "jaime-cervantes", true, true],
    ["con tienda y sin perfil", "hazlo-sano", null, true, false],
    ["sin tienda y con perfil", null, "jaime-cervantes", false, true],
    ["sin tienda y sin perfil", null, null, false, false],
  ] as const)(
    "Then a session %s offers store=%s profile=%s",
    async (_caso, storeHandle, username, offersStore, offersProfile) => {
      renderMenu({ storeHandle, username });
      await openMenu();

      expect(!!screen.queryByText(es.nav.myStore)).toBe(offersStore);
      expect(!!screen.queryByText(es.nav.myProfile)).toBe(offersProfile);
      // La cuenta está siempre: es la puerta a dar de alta lo que todavía no existe.
      expect(screen.getByText(es.nav.myAccount)).toBeInTheDocument();
    },
  );

  it("Then the store and the profile point at their public address", async () => {
    renderMenu({ storeHandle: "hazlo-sano", username: "jaime-cervantes" });
    await openMenu();

    const hrefFor = (label: string) =>
      screen.getByText(label).closest("a")?.getAttribute("href");

    expect(hrefFor(es.nav.myStore)).toBe("/tienda/hazlo-sano");
    expect(hrefFor(es.nav.myProfile)).toBe("/u/jaime-cervantes");
  });

  /* Es lo que Instagram, TikTok y X ponen bajo el nombre en este mismo menú: dice con qué identidad
     estás mirando el sitio, que con varias cuentas es la pregunta que uno se hace. */
  it("Then the reserved address is shown under the name", async () => {
    renderMenu({ username: "jaime-cervantes" });
    await openMenu();

    expect(screen.getByText("@jaime-cervantes")).toBeInTheDocument();
  });

  it("Then nothing is invented for someone who reserved no address", async () => {
    renderMenu();
    await openMenu();

    expect(screen.queryByText(/^@/)).not.toBeInTheDocument();
  });
});
