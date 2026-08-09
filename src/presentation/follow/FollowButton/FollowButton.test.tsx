import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/* La acción es un Server Action y arrastra `next-auth`, que no resuelve en Vitest. Aquí se prueba
   lo que el botón pinta, no lo que hace el servidor al pulsarlo — eso vive en el e2e. */
vi.mock("../followAction", () => ({ toggleFollow: vi.fn() }));

import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import FollowButton from "./FollowButton";

const TIENDA = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";

function render({ followers = 0, isFollowing = false, canFollow = true } = {}) {
  return renderWithIntl(
    <FollowButton
      sellerId={TIENDA}
      followers={followers}
      isFollowing={isFollowing}
      canFollow={canFollow}
      path="/tienda/hazlo-sano"
    />,
  );
}

describe("El botón de seguir", () => {
  /* Hoy hay una tienda y un perfil reclamado en toda la base, así que este es el 100% de los casos:
     un "0 seguidores" convertiría cada página nueva en una página abandonada. */
  it("no enseña ningún número cuando no la sigue nadie", () => {
    render({ followers: 0 });

    expect(screen.queryByTestId("follower-count")).not.toBeInTheDocument();
    expect(screen.getByTestId("follow-button")).toHaveTextContent(
      es.follow.follow,
    );
  });

  it.each([
    [1, "1 seguidor"],
    [2, "2 seguidores"],
    [312, "312 seguidores"],
  ])("con %i seguidores dice %j", (followers, texto) => {
    render({ followers });

    expect(screen.getByTestId("follower-count")).toHaveTextContent(texto);
  });

  it("dice que ya la sigues cuando la sigues", () => {
    render({ followers: 5, isFollowing: true });

    expect(screen.getByTestId("follow-button")).toHaveTextContent(
      es.follow.unfollow,
    );
  });

  /* El formulario manda una intención —"cambia lo que haya"—, no un estado. Con dos pestañas
     abiertas y vistas distintas, mandar el estado haría que la última en llegar pisara a la otra. */
  it("manda el destino, no si quiere seguir o dejar de seguir", () => {
    const { container } = render({ isFollowing: true });

    const campos = [...container.querySelectorAll("input[type=hidden]")].map(
      (node) => node.getAttribute("name"),
    );

    expect(campos).toEqual(["sellerId", "followedId", "path"]);
    expect(campos).not.toContain("following");
  });

  /* Un seguidor que se pierde al cerrar el navegador no es un seguidor, así que sin sesión no se
     ofrece un botón que va a fallar: se ofrece la puerta de entrar, y `callbackUrl` devuelve aquí. */
  it("sin sesión es un enlace a entrar que vuelve a la misma página", () => {
    render({ canFollow: false, followers: 7 });

    const enlace = screen.getByTestId("follow-signin");

    expect(enlace).toHaveAttribute(
      "href",
      "/auth/signin?callbackUrl=%2Ftienda%2Fhazlo-sano",
    );
    expect(screen.queryByTestId("follow-button")).not.toBeInTheDocument();
    // El contador se sigue viendo: es información pública, no depende de quién mire.
    expect(screen.getByTestId("follower-count")).toHaveTextContent(
      "7 seguidores",
    );
  });

  it("manda un solo destino: el otro va vacío", () => {
    const { container } = render();

    expect(
      container.querySelector("input[name=sellerId]")?.getAttribute("value"),
    ).toBe(TIENDA);
    expect(
      container.querySelector("input[name=followedId]")?.getAttribute("value"),
    ).toBe("");
  });
});
