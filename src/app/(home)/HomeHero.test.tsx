import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import HomeHero from "./HomeHero";

/**
 * La portada 5.2 del canvas de v2.
 *
 * Se renderiza con los catálogos **reales** (`renderWithIntl`), así que borrar una clave o romper
 * el plural del rótulo rompe la prueba en vez de llegar a producción.
 */
describe("HomeHero", () => {
  it("presenta el sitio con la voz de la marca y un solo h1", () => {
    renderWithIntl(<HomeHero publicationCount={31} />);

    const titulo = screen.getByRole("heading", { level: 1 });

    expect(titulo).toHaveTextContent(/cuidar tu salud es cuidar tu tiempo/i);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  /*
   * El canvas ilustra «Xalapa · 34 productores activos». En la base hay dos tiendas, así que un
   * contador de productores delataría; lo que sí se sabe es cuántas publicaciones hay delante.
   */
  it.each<[number, RegExp]>([
    [31, /31 publicaciones/i],
    [1, /1 publicación/i],
    [0, /sin publicaciones todavía/i],
  ])("dice cuántas publicaciones hay: %i", (count, esperado) => {
    renderWithIntl(<HomeHero publicationCount={count} />);

    expect(screen.getByText(esperado)).toBeInTheDocument();
  });

  it("nombra la comunidad que el sitio sirve de verdad", () => {
    renderWithIntl(<HomeHero publicationCount={31} />);

    expect(screen.getByText(/Tezonapa, Veracruz/)).toBeInTheDocument();
  });

  /*
   * Un CTA de portada tiene que ser un enlace: se abre en pestaña nueva, se copia y lo sigue un
   * rastreador. Con `router.push` desde un `<button>` no pasa ninguna de las tres.
   */
  it.each<[string, string]>([
    ["Ver lo que hay hoy", "/productos"],
    ["Publicar lo mío", "/publicar"],
  ])("ofrece «%s» como enlace a %s", (label, href) => {
    renderWithIntl(<HomeHero publicationCount={31} />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href,
    );
  });

  /* El énfasis viaja dentro del mensaje para que cada idioma decida qué palabra destaca. */
  it("destaca una parte del titular, y la elige el catálogo", () => {
    const { container } = renderWithIntl(<HomeHero publicationCount={31} />);

    const enfasis = container.querySelector("h1 em");

    expect(enfasis).toHaveTextContent("tu tiempo");
  });

  it("en inglés destaca la parte que le toca al inglés", () => {
    const { container } = renderWithIntl(<HomeHero publicationCount={31} />, {
      locale: "en",
    });

    expect(container.querySelector("h1 em")).toHaveTextContent("your time");
  });
});
