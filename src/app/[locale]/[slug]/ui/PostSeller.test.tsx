import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PostSeller from "./PostSeller";

/**
 * `Scenario Outline` «Qué identidad se pinta según lo que exista» de `sellerStore.feature`.
 *
 * Va en Vitest y no en Playwright porque son combinaciones de props: en la base **las 26
 * publicaciones con tienda son de Hazlo Sano**, así que los casos «sin tienda» habría que
 * sembrarlos para afirmar algo que aquí se comprueba sin base ni navegador.
 *
 * Heredado de `PostIdentity.test.tsx` cuando la fila se convirtió en la tarjeta del 5.4: las
 * combinaciones no cambiaron —quién firma sigue siendo la misma pregunta—, lo que cambió es que
 * ahora el nombre se lee y la distancia va al lado.
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

describe("La tarjeta de quién publica", () => {
  it("con tienda y autor con perfil, enlaza a las dos", () => {
    renderWithIntl(
      <PostSeller {...{ seller: HAZLO_SANO, author: CON_PERFIL }} />,
    );

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
    renderWithIntl(
      <PostSeller {...{ seller: HAZLO_SANO, author: SIN_PERFIL }} />,
    );

    expect(screen.getByTestId("post-identity-store")).toBeInTheDocument();
    expect(screen.queryByTestId("post-identity-author")).toBeNull();
  });

  it("sin tienda y con autor con perfil, muestra solo al autor", () => {
    renderWithIntl(<PostSeller {...{ seller: null, author: CON_PERFIL }} />);

    expect(screen.queryByTestId("post-identity-store")).toBeNull();
    expect(screen.getByTestId("post-identity-author")).toBeInTheDocument();
  });

  /** 5 de las 31 publicaciones de la base están así: sin tienda y sin perfil reclamado. */
  it("sin tienda ni perfil, no pinta la tarjeta", () => {
    const { container } = renderWithIntl(
      <PostSeller {...{ seller: null, author: SIN_PERFIL }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * El nombre **sí se lee** ahora, y es el cambio del 5.4: antes solo estaba en el árbol de
   * accesibilidad porque el único hijo visible del enlace era un logo decorativo.
   */
  it("enseña el nombre de la tienda, no solo su logo", () => {
    renderWithIntl(
      <PostSeller {...{ seller: HAZLO_SANO, author: CON_PERFIL }} />,
    );

    const tienda = screen.getByRole("link", { name: "Hazlo Sano" });

    expect(tienda).toHaveTextContent("Hazlo Sano");
  });

  it("nombra igual a quien publica", () => {
    renderWithIntl(
      <PostSeller {...{ seller: HAZLO_SANO, author: CON_PERFIL }} />,
    );

    expect(
      screen.getByRole("link", { name: "Jaime Cervantes" }),
    ).toBeInTheDocument();
  });

  /* Sin logo la tarjeta sigue: el nombre enlazado es lo que importa, la imagen acompaña. */
  it("sin logo, la tienda se sigue enlazando", () => {
    renderWithIntl(
      <PostSeller
        {...{
          seller: { handle: "hazlo-sano", name: "Hazlo Sano", logoUrl: null },
          author: CON_PERFIL,
        }}
      />,
    );

    expect(screen.getByTestId("post-identity-store")).toBeInTheDocument();
  });
});

describe("La distancia, ahora junto a quién la recorre", () => {
  /**
   * Quién resuelve la cifra es `PostDetail` —arrastra `next-auth` por su cadena—, así que aquí se
   * afirma lo único que es de esta tarjeta: que lo que le entregan se pinta, y que sin nada no
   * deja un hueco empujando la fila.
   */
  it("coloca lo que le entreguen", () => {
    renderWithIntl(
      <PostSeller
        {...{
          seller: HAZLO_SANO,
          author: CON_PERFIL,
          location: <span data-testid="distancia-de-prueba">a 3 km</span>,
        }}
      />,
    );

    expect(screen.getByTestId("distancia-de-prueba")).toBeInTheDocument();
  });

  it("sin nada que decir de la distancia, no deja hueco", () => {
    renderWithIntl(
      <PostSeller {...{ seller: HAZLO_SANO, author: CON_PERFIL }} />,
    );

    expect(screen.queryByTestId("distancia-de-prueba")).toBeNull();
    expect(screen.getByTestId("post-identity")).toBeInTheDocument();
  });
});
