import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AccountSection from "./AccountSection";

const { readViewerId, findProfileOfUser, findSellerOfUser } = vi.hoisted(
  () => ({
    readViewerId: vi.fn(),
    findProfileOfUser: vi.fn(),
    findSellerOfUser: vi.fn(),
  }),
);

vi.mock("~/infra/auth/readViewerId", () => ({ readViewerId }));
vi.mock("~/infra/dataAccess/identity/sessionIdentity", () => ({
  findProfileOfUser,
  findSellerOfUser,
}));

/** Quién mira y qué tiene, que es lo único de lo que depende esta decisión. */
async function renderSection(viewer: {
  id: string | null;
  username?: string;
  hasStore?: boolean;
}): Promise<void> {
  readViewerId.mockResolvedValue(viewer.id);
  findProfileOfUser.mockResolvedValue(
    viewer.username ? { username: viewer.username } : null,
  );
  findSellerOfUser.mockResolvedValue(viewer.hasStore ? { id: "s1" } : null);

  renderWithIntl(
    await AccountSection({
      active: "habits",
      children: <p>el contenido de la página</p>,
    }),
  );
}

describe("AccountSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envuelve la página con la navegación de la cuenta", async () => {
    await renderSection({ id: "u1" });

    expect(screen.getByTestId("account-nav")).toBeInTheDocument();
    expect(screen.getByText("el contenido de la página")).toBeInTheDocument();
  });

  /*
   * `/habitos` es pública y se comparte. A quien llega sin sesión, un menú de «Mi cuenta / Mis
   * pedidos» le ofrecería cinco destinos que lo mandan a identificarse: se le enseña la página y
   * ya está.
   */
  it("pero a quien no ha entrado le deja la página tal cual", async () => {
    await renderSection({ id: null });

    expect(screen.queryByTestId("account-nav")).not.toBeInTheDocument();
    expect(screen.getByText("el contenido de la página")).toBeInTheDocument();
  });

  /* Sin sesión no hay a quién leerle el perfil ni la tienda: preguntarlo sería una consulta que no
     puede contestar nada. */
  it("y ni siquiera pregunta quién es", async () => {
    await renderSection({ id: null });

    expect(findProfileOfUser).not.toHaveBeenCalled();
    expect(findSellerOfUser).not.toHaveBeenCalled();
  });

  it("marca la página en la que estás", async () => {
    await renderSection({ id: "u1" });

    expect(screen.getByRole("link", { name: es.nav.myHabits })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  /* Lo que el menú condiciona sale de la sesión, no de una prop que cada página tuviera que
     acordarse de pasar: ese olvido es lo que este componente vino a hacer imposible. */
  it("lee por su cuenta lo que el menú condiciona", async () => {
    await renderSection({ id: "u1", username: "jaime", hasStore: true });

    expect(
      screen.getByRole("link", { name: es.nav.myPublications }),
    ).toHaveAttribute("href", "/u/jaime");
    expect(
      screen.getByRole("link", { name: es.nav.schedule }),
    ).toBeInTheDocument();
  });
});
