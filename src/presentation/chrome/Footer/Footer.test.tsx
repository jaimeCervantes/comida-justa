import { describe, expect, it, vi } from "vitest";
import {
  PUBLICATION_PILLARS,
  publicationPillarNumber,
} from "~/domain/entities/post/publicationPillars";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import { PILLAR_ITEMS } from "../Header/menuItems";
import Footer from "./Footer";

/**
 * El pie enlaza con `Link` de next-intl y ahora aloja el conmutador de idioma: los dos piden el
 * enrutador de la aplicación, que en jsdom no existe. Es el mismo doble mínimo que usa
 * `LanguageSwitcher.test.tsx`; lo que aquí se afirma no depende de a dónde navegue.
 */
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useParams: () => ({}),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("When the footer is rendered", () => {
  /**
   * Regresión: el logotipo se pintaba con un degradado recortado contra el texto
   * (`bg-clip-text text-transparent`) cuyo primer tope apuntaba a `--highlight`, un token que se
   * perdió al mudar los colores a `design_system/tokens`. Sin ese color el arranque quedaba
   * transparente y «Hazlo» era ilegible.
   *
   * Se afirma **que no vuelve el recorte**, que es el defecto; qué tinta exacta lleva ya no, porque
   * eso cambió al volverse oscuro el pie y volverá a cambiar. Lo que la tinta tiene que cumplir
   * —contraste sobre la banda— lo mide `invertedSurface.contrast.test.ts`.
   */
  it("Then the brand name is painted with a solid color, not clipped from a gradient", () => {
    const view = render(<Footer />);
    const wordmark = view.getByText(PUBLIC_BRAND_NAME);

    expect(wordmark).not.toHaveClass("text-transparent");
    expect(wordmark).not.toHaveClass("bg-clip-text");
  });

  /** El 5.16: el pie es oscuro **en los dos temas**, y por eso no usa una superficie temática. */
  it("Then it sits on the inverted surface, which does not follow the theme", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");

    expect(footer).toHaveClass("bg-surface-inverted");
    expect(footer?.className).not.toMatch(/dark:/);
  });
});

describe("Los pilares del pie", () => {
  /**
   * Eran cuatro palomitas con un nombre al lado, sin enlace: decoración justo donde alguien busca a
   * dónde ir. Es lo que este slice arregla, y lo que esta prueba impide que vuelva.
   */
  it("llevan a alguna parte", () => {
    const view = render(<Footer />);

    for (const item of PILLAR_ITEMS) {
      expect(view.getByTestId(`footer-pillar-${item.pillar}`).tagName).toBe(
        "A",
      );
    }
  });

  /**
   * Con su número, como en el resto del sitio. Y el número sale del dominio: si mañana alguien
   * reordena `PILLAR_ITEMS` por gusto, la numeración no se mueve — que es justo lo que
   * `publicationPillars.ts` dejó escrito que no debía pasar.
   */
  it("traen el número que les da el dominio, no su posición en la lista", () => {
    const view = render(<Footer />);

    for (const item of PILLAR_ITEMS) {
      expect(
        view.getByTestId(`footer-pillar-${item.pillar}`),
      ).toHaveTextContent(String(publicationPillarNumber(item.pillar)));
    }
  });

  it("están los cuatro, sin sobras", () => {
    const view = render(<Footer />);
    const pintados = PUBLICATION_PILLARS.filter((pillar) =>
      view.queryByTestId(`footer-pillar-${pillar.key}`),
    );

    expect(pintados).toHaveLength(PUBLICATION_PILLARS.length);
  });
});

describe("El idioma", () => {
  /**
   * Baja del header por instrucción del 5.16: la barra de arriba ya cargaba con búsqueda, publicar
   * y cuenta, y cambiar de idioma se hace una vez, no en cada visita.
   */
  it("se cambia desde el pie", () => {
    const view = render(<Footer />);

    expect(
      view.getByRole("button", { name: /idioma|language/i }),
    ).toBeInTheDocument();
  });
});
