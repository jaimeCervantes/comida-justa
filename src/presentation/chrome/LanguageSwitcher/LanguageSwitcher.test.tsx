import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * La navegación de next-intl necesita el enrutador de la aplicación, que en jsdom no existe. Se
 * sustituye por el doble mínimo: lo que se afirma es **con qué** se le pide el cambio de idioma.
 */
const replace = vi.fn();

vi.mock("~/i18n/navigation", () => ({
  usePathname: () => "/tienda/[slug]",
  useRouter: () => ({ replace }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "hazlo-sano" }),
}));

async function openSwitcher() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: es.nav.changeLanguage }));

  return user;
}

describe("Cuando alguien abre el selector de idioma", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("Entonces no hay panel hasta que se abre", () => {
    renderWithIntl(<LanguageSwitcher />);

    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });

  it("Entonces ofrece los dos idiomas del sitio", async () => {
    renderWithIntl(<LanguageSwitcher />);
    await openSwitcher();

    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  /* Sin esto, el disparador es un botón que no dice que abre nada: quien navega con lector de
     pantalla no sabe que hay un menú detrás, ni si está abierto. Lo pone Radix, y es justo lo que
     había que sincronizar a mano con el `useState` de antes. */
  it("Entonces el disparador anuncia que abre un menú y si está abierto", async () => {
    renderWithIntl(<LanguageSwitcher />);
    const trigger = screen.getByRole("button", {
      name: es.nav.changeLanguage,
    });

    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await openSwitcher();

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("Entonces elegir un idioma pide la MISMA ruta en ese idioma", async () => {
    renderWithIntl(<LanguageSwitcher />);
    const user = await openSwitcher();

    await user.click(screen.getByText("English"));

    /* Con `params`, que es lo que hace que quien mira una tienda siga en esa tienda y no acabe en
       el inicio del otro idioma. */
    expect(replace).toHaveBeenCalledWith(
      { pathname: "/tienda/[slug]", params: { slug: "hazlo-sano" } },
      { locale: "en" },
    );
  });

  /**
   * El defecto que motivó todo esto. Se dispara el `pointerdown` a mano en vez de con
   * `userEvent.click`: un desplegable abierto es modal y pone `pointer-events: none` en el cuerpo,
   * así que `userEvent` se niega a tocarlo —igual que Playwright en la e2e, donde se usa
   * `mouse.click` por la misma razón—. Lo que Radix escucha para cerrarse es exactamente este
   * evento.
   */
  it("Entonces se cierra al tocar en cualquier otra parte", async () => {
    renderWithIntl(<LanguageSwitcher />);
    await openSwitcher();

    fireEvent.pointerDown(document.body);

    await waitFor(() =>
      expect(screen.queryByText("English")).not.toBeInTheDocument(),
    );
  });
});
