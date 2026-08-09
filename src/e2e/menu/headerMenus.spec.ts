import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import HeaderMenusPage from "./HeaderMenusPage";

// Escenarios en `src/e2e/menu/headerMenus.feature`. No siembra nada: la cabecera se pinta en todas
// las páginas y aquí solo se abre y se cierra lo que ya está.

test.describe("Cuando un visitante abre el selector de idioma", () => {
  test("Entonces se cierra al tocar en cualquier otra parte", async ({
    page,
  }) => {
    const header = new HeaderMenusPage(page);

    await header.goto();
    await header.openLanguageMenu();

    const before = page.url();
    await header.clickOutside();

    await expect(header.languageMenu()).toHaveCount(0);
    // Que no se haya cerrado *navegando* a otro sitio: el toque cayó en el fondo de la página.
    expect(page.url()).toBe(before);
  });

  /**
   * El toque que cierra no puede gastarse en cerrar.
   *
   * Radix abre en modo modal por omisión: mientras el menú está abierto pone `pointer-events: none`
   * en el `body` y `aria-hidden` en el resto de la página. El menú se cerraba al tocar fuera —eso
   * ya funcionaba— pero **ese toque no llegaba a su destino**: tocar un enlace lo cerraba sin
   * navegar, y había que tocar otra vez. Un desplegable de una barra no reclama la pantalla.
   */
  test("Entonces el toque que lo cierra hace además lo suyo", async ({
    page,
  }) => {
    const header = new HeaderMenusPage(page);

    await header.goto();
    await header.openLanguageMenu();

    await header.clickLinkBehindTheMenu(es.nav.about);

    await expect(header.languageMenu()).toHaveCount(0);
    await expect(page).toHaveURL(/\/nosotros\/?$/);
  });

  test("Entonces Escape también lo cierra", async ({ page }) => {
    const header = new HeaderMenusPage(page);

    await header.goto();
    await header.openLanguageMenu();

    await page.keyboard.press("Escape");

    await expect(header.languageMenu()).toHaveCount(0);
  });

  /* La red que protege el cambio de motor: el selector pasó de un `useState` escrito a mano a
     Radix, y lo único que hace —servir la misma página en el otro idioma— no puede perderse. */
  test("Entonces elegir English sirve la misma página en inglés", async ({
    page,
  }) => {
    const header = new HeaderMenusPage(page);

    await header.goto();
    await header.openLanguageMenu();
    await header.chooseLanguage("English");

    await expect(page).toHaveURL(/\/en\/?$/);
  });
});

test.describe("Cuando quien inició sesión abre el menú de su avatar", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces se cierra al tocar en cualquier otra parte", async ({
    page,
  }) => {
    const header = new HeaderMenusPage(page);

    await header.goto();
    await header.openUserMenu();

    const before = page.url();
    await header.clickOutside();

    await expect(header.userMenu()).toHaveCount(0);
    expect(page.url()).toBe(before);
  });
});
