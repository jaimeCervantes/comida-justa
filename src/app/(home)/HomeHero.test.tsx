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
/** La forma mínima de una tarjeta: lo que la portada necesita de la más reciente. */
const YOGA = {
  id: "1",
  title: "Sesión de yoga para dolor de espalda, principiantes",
  to: "/sesion-de-yoga-para-dolor-de-espalda-principiantes",
  media: [
    {
      type: "image",
      url: "https://example.test/yoga.webp",
      alt: "Sesión de yoga",
      width: 1200,
      height: 900,
    },
  ],
};

describe("HomeHero", () => {
  it("presenta el sitio con la voz de la marca y un solo h1", () => {
    renderWithIntl(<HomeHero publicationCount={31} nearbyCount={null} />);

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
    renderWithIntl(<HomeHero publicationCount={count} nearbyCount={null} />);

    expect(screen.getByText(esperado)).toBeInTheDocument();
  });

  it("nombra la comunidad que el sitio sirve de verdad", () => {
    renderWithIntl(<HomeHero publicationCount={31} nearbyCount={null} />);

    expect(screen.getByText(/Tezonapa, Veracruz/)).toBeInTheDocument();
  });

  /*
   * El rótulo decía «Tezonapa, Veracruz · 426 publicaciones» a todo el mundo: ni el lugar ni la
   * cifra tenían que ver con quien miraba. Con ubicación compartida, ahora habla de esa persona.
   */
  it.each<[number, RegExp]>([
    [8, /8 publicaciones a menos de 50 km de ti/i],
    [1, /1 publicación a menos de 50 km de ti/i],
  ])(
    "con ubicación, dice cuánto queda cerca de quien mira: %i",
    (cerca, esperado) => {
      renderWithIntl(<HomeHero publicationCount={426} nearbyCount={cerca} />);

      expect(screen.getByTestId("home-eyebrow")).toHaveTextContent(esperado);
      /* Y deja de hablar de Tezonapa: quien comparte su ubicación no está mirando desde ahí. */
      expect(screen.queryByText(/Tezonapa/)).not.toBeInTheDocument();
    },
  );

  /*
   * El fallback que evita la peor pantalla posible. Hoy todo lo publicado está en Tezonapa, así que
   * «0 publicaciones cerca» le diría a quien mira desde otro estado que el sitio está vacío —
   * mientras el feed de abajo le enseña 426. Se le dice de dónde es lo que ve.
   */
  it("sin nada cerca, vuelve al rótulo de la comunidad en vez de anunciar un cero", () => {
    renderWithIntl(<HomeHero publicationCount={426} nearbyCount={0} />);

    const eyebrow = screen.getByTestId("home-eyebrow");

    expect(eyebrow).toHaveTextContent(/Tezonapa, Veracruz/);
    expect(eyebrow).toHaveTextContent(/426 publicaciones/);
    expect(eyebrow).not.toHaveTextContent(/0 publicaciones/);
  });

  /*
   * Un CTA de portada tiene que ser un enlace: se abre en pestaña nueva, se copia y lo sigue un
   * rastreador. Con `router.push` desde un `<button>` no pasa ninguna de las tres.
   */
  it.each<[string, string]>([
    ["Ver lo que hay hoy", "/productos"],
    ["Publicar lo mío", "/publicar"],
  ])("ofrece «%s» como enlace a %s", (label, href) => {
    renderWithIntl(<HomeHero publicationCount={31} nearbyCount={null} />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href,
    );
  });

  /* El énfasis viaja dentro del mensaje para que cada idioma decida qué palabra destaca. */
  it("destaca una parte del titular, y la elige el catálogo", () => {
    const { container } = renderWithIntl(
      <HomeHero publicationCount={31} nearbyCount={null} />,
    );

    const enfasis = container.querySelector("h1 em");

    expect(enfasis).toHaveTextContent("tu tiempo");
  });

  /*
   * El canvas pone una «foto de portada, mercado local, 4:3» que no existe como archivo. En vez de
   * un marcador de posición, la portada enseña lo último que publicó la comunidad: es real, cambia
   * sola, y demuestra la promesa del titular en vez de ilustrarla.
   */
  it("enseña lo último publicado, y lleva a ello", () => {
    renderWithIntl(
      <HomeHero publicationCount={31} nearbyCount={null} latest={YOGA} />,
    );

    const cover = screen.getByTestId("home-cover");

    expect(cover).toHaveAttribute("href", YOGA.to);
    expect(cover).toHaveTextContent(/sesión de yoga/i);
    expect(cover).toHaveTextContent(/lo último que se publicó/i);
  });

  it("y la foto se anuncia con lo que es, no con un texto de relleno", () => {
    renderWithIntl(
      <HomeHero publicationCount={31} nearbyCount={null} latest={YOGA} />,
    );

    expect(screen.getByAltText("Sesión de yoga")).toBeInTheDocument();
  });

  /* Un sitio recién abierto no tiene nada que enseñar, y ahí la portada es una sola columna. */
  it.each<[string, unknown]>([
    ["sin publicaciones", undefined],
    [
      "con una publicación sin media",
      { id: "2", title: "Anuncio", to: "/a", media: [] },
    ],
  ])("no inventa una portada %s", (_caso, latest) => {
    renderWithIntl(
      <HomeHero
        publicationCount={0}
        nearbyCount={null}
        latest={latest as typeof YOGA}
      />,
    );

    expect(screen.queryByTestId("home-cover")).not.toBeInTheDocument();
    // Pero el titular y las acciones siguen ahí: la portada no depende de la foto.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("en inglés destaca la parte que le toca al inglés", () => {
    const { container } = renderWithIntl(
      <HomeHero publicationCount={31} nearbyCount={null} />,
      {
        locale: "en",
      },
    );

    expect(container.querySelector("h1 em")).toHaveTextContent("your time");
  });
});
