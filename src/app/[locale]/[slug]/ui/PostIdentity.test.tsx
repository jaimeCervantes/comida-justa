import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PostIdentity from "./PostIdentity";

/**
 * `Scenario Outline` "Qué identidad se pinta según lo que exista" de `sellerStore.feature`.
 *
 * Va en Vitest y no en Playwright porque son combinaciones de props: en la base todas las
 * publicaciones con tienda son de Hazlo Sano, así que los casos "sin tienda" habría que sembrarlos
 * para afirmar algo que aquí se comprueba sin base ni navegador.
 */
const HAZLO_SANO = {
  handle: "hazlo-sano",
  name: "Hazlo Sano",
  logoUrl: "/logo.webp",
};

const CON_PERFIL = {
  id: "u1",
  name: "Jaime Cervantes",
  username: "jaime-cervantes",
};

const SIN_PERFIL = { id: "u1", name: "Jaime Cervantes" };

describe("La fila de identidad de una publicación", () => {
  it("con tienda y autor con perfil, enlaza a las dos", () => {
    renderWithIntl(<PostIdentity seller={HAZLO_SANO} author={CON_PERFIL} />);

    expect(screen.getByTestId("post-identity-store")).toHaveAttribute(
      "href",
      "/tienda/hazlo-sano",
    );
    expect(screen.getByTestId("post-identity-author")).toHaveAttribute(
      "href",
      "/u/jaime-cervantes",
    );
  });

  it("con tienda y autor sin perfil, muestra solo la tienda", () => {
    renderWithIntl(<PostIdentity seller={HAZLO_SANO} author={SIN_PERFIL} />);

    expect(screen.getByTestId("post-identity-store")).toBeInTheDocument();
    expect(screen.queryByTestId("post-identity-author")).toBeNull();
  });

  it("sin tienda y con autor con perfil, muestra solo al autor", () => {
    renderWithIntl(<PostIdentity seller={null} author={CON_PERFIL} />);

    expect(screen.queryByTestId("post-identity-store")).toBeNull();
    expect(screen.getByTestId("post-identity-author")).toBeInTheDocument();
  });

  /** 5 de las 23 publicaciones de la base están así: sin tienda y sin perfil reclamado. */
  it("sin tienda ni perfil, no deja nada en la línea", () => {
    const { container } = renderWithIntl(
      <PostIdentity seller={null} author={SIN_PERFIL} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * El nombre no se ve —lo dice el logo, y repetirlo alarga la línea—, pero tiene que estar: el
   * único hijo visible del enlace es una imagen decorativa, y un enlace sin nombre accesible se
   * anuncia como "enlace" a secas.
   */
  it("nombra la tienda para quien escucha, aunque no se lea en pantalla", () => {
    renderWithIntl(<PostIdentity seller={HAZLO_SANO} author={CON_PERFIL} />);

    expect(
      screen.getByRole("link", { name: "Hazlo Sano" }),
    ).toBeInTheDocument();
  });

  it("nombra igual a quien publica", () => {
    renderWithIntl(<PostIdentity seller={HAZLO_SANO} author={CON_PERFIL} />);

    expect(
      screen.getByRole("link", { name: "Jaime Cervantes" }),
    ).toBeInTheDocument();
  });

  /* Sin logo la fila sigue: el nombre enlazado es lo que importa, la imagen acompaña. */
  it("sin logo, la tienda se sigue enlazando", () => {
    renderWithIntl(
      <PostIdentity
        seller={{ handle: "hazlo-sano", name: "Hazlo Sano", logoUrl: null }}
        author={CON_PERFIL}
      />,
    );

    expect(screen.getByTestId("post-identity-store")).toBeInTheDocument();
  });
});
