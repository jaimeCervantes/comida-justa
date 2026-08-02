import {
  devices,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test";
import es from "~/i18n/messages/es.json";

/** ¿Está el enlace donde el navegador lo devolvería si alguien tocara ahí? */
async function isUnderTheFinger(
  page: Page,
  locator: Locator,
): Promise<boolean> {
  const box = await locator.boundingBox();

  if (!box) return false;

  return page.evaluate(
    ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest("a")),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
}

/**
 * ¿Un dedo puede llegar a esto?
 *
 * Ni `toBeVisible` ni `click()` sirven aquí. Un enlace recortado por un `overflow-hidden` sigue
 * teniendo caja, así que cuenta como visible; y Playwright **desplaza por API** contenedores que
 * un dedo no puede desplazar, así que el clic también pasa.
 *
 * Por eso se desplaza con la rueda, que es lo que hace un dedo: solo mueve lo que de verdad se
 * puede desplazar. Un menú que recorta lo que no cabe se queda quieto y el enlace nunca aparece.
 */
async function expectReachableByScrolling(
  page: Page,
  locator: Locator,
): Promise<void> {
  await page.mouse.move(200, 400);

  for (let intento = 0; intento < 10; intento++) {
    if (await isUnderTheFinger(page, locator)) return;

    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(100);
  }

  expect(
    await isUnderTheFinger(page, locator),
    "el enlace no aparece ni desplazando el menú",
  ).toBe(true);
}

// La suite corre en español (`playwright.config.ts` fija `locale: "es-MX"`), así que se afirma la
// redacción que ve el visitante.
const COMUNIDAD = es.nav.communityMenu;
const NEGOCIOS = es.nav.community.localBusinesses.title;
const NOSOTROS = es.nav.about;
const POR_CATEGORIA = es.nav.byCategory;
// Una categoría real del catálogo, con publicaciones.
const PANADERIA = "Panadería";

test.use({ viewport: devices["Pixel 5"].viewport });

test.describe("Cuando alguien abre el menú desde su teléfono", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: es.nav.openMenu }).click();
  });

  /* El menú de escritorio también está en el DOM —lo esconde el CSS, no deja de existir—, así que
     todo se busca dentro del panel móvil o se estaría afirmando sobre el menú equivocado. */
  const mobileMenu = (page: Page) => page.getByTestId("mobile-menu");

  test("Entonces puede tocar la última entrada de «Comunidad»", async ({
    page,
  }) => {
    await mobileMenu(page).getByRole("button", { name: COMUNIDAD }).click();

    const negocios = mobileMenu(page).getByRole("link", { name: NEGOCIOS });

    await expect(negocios).toBeVisible();
    await expectReachableByScrolling(page, negocios);

    await negocios.click();
    await expect(page).toHaveURL(/\/negocios-locales$/);
  });

  test("Entonces puede recorrer el menú hasta la última entrada", async ({
    page,
  }) => {
    await mobileMenu(page)
      .getByRole("link", { name: NOSOTROS, exact: true })
      .click();

    await expect(page).toHaveURL(/\/nosotros$/);
  });

  test("Entonces las categorías esperan detrás de su propio desplegable", async ({
    page,
  }) => {
    const panaderia = mobileMenu(page).getByRole("link", { name: PANADERIA });

    /* Cerrado, el acordeón deja su contenido a altura cero. No se afirma con `toBeHidden`: un
       hijo recortado conserva su caja y contaría como visible. Lo que sí distingue es que nadie
       pueda tocarlo. */
    expect(
      await isUnderTheFinger(page, panaderia),
      "las categorías se ven sin haber desplegado su sección",
    ).toBe(false);

    await mobileMenu(page).getByRole("button", { name: POR_CATEGORIA }).click();

    await expect(panaderia).toBeVisible();
    await expectReachableByScrolling(page, panaderia);
  });
});
