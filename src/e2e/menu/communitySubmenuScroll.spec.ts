import { expect, type Locator, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

type SubmenuMetrics = {
  bottom: number;
  clientHeight: number;
  scrollHeight: number;
  top: number;
  viewportHeight: number;
};

type ElementBounds = {
  bottom: number;
  top: number;
};

const COMMUNITY_OPEN_LABEL = `Abrir el submenú de ${es.nav.communityMenu}`;

async function submenuMetrics(submenu: Locator): Promise<SubmenuMetrics> {
  return submenu.evaluate((element) => {
    const bounds = element.getBoundingClientRect();

    return {
      bottom: bounds.bottom,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      top: bounds.top,
      viewportHeight: window.innerHeight,
    };
  });
}

async function elementBounds(locator: Locator): Promise<ElementBounds> {
  await expect(locator).toBeVisible();

  return locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();

    return {
      bottom: bounds.bottom,
      top: bounds.top,
    };
  });
}

async function openCommunitySubmenu(page: Page): Promise<Locator> {
  const menu = page.getByTestId("desktop-menu");
  await menu
    .getByRole("button", {
      name: COMMUNITY_OPEN_LABEL,
      exact: true,
    })
    .click();

  const submenu = menu.getByTestId("desktop-submenu");
  await expect(submenu).toBeVisible();

  return submenu;
}

// Escenario en `src/e2e/menu/communitySubmenuScroll.feature`. No siembra nada: mide solo la
// cabecera de escritorio con el contenido real de navegación.
test("el submenú de Comunidad mantiene alcanzable el enlace Nosotros con scroll interno", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 560 });
  await page.goto("/nosotros");

  const submenu = await openCommunitySubmenu(page);

  const beforeScroll = await submenuMetrics(submenu);
  expect(beforeScroll.top).toBeGreaterThanOrEqual(0);
  expect(beforeScroll.bottom).toBeLessThanOrEqual(beforeScroll.viewportHeight);
  expect(beforeScroll.scrollHeight).toBeGreaterThan(beforeScroll.clientHeight);

  await submenu.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const finalLink = submenu
    .getByRole("link", { name: es.nav.community.localBusinesses.title })
    .first();
  const [finalLinkBounds, afterScroll] = await Promise.all([
    elementBounds(finalLink),
    submenuMetrics(submenu),
  ]);

  expect(finalLinkBounds.top).toBeGreaterThanOrEqual(afterScroll.top);
  expect(finalLinkBounds.bottom).toBeLessThanOrEqual(afterScroll.bottom);

  await finalLink.click();
  await expect(page).toHaveURL(/\/negocios-locales\/?$/);
});

test("Nosotros vive junto a los enlaces principales de Comunidad", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/nosotros");

  const submenu = await openCommunitySubmenu(page);
  const aboutLink = submenu.getByRole("link", { name: es.nav.about }).first();
  const byCategory = submenu.getByText(es.nav.byCategory, { exact: true });
  const primaryLabels = [
    es.nav.publications,
    es.nav.brandProducts,
    es.nav.events,
    es.nav.about,
  ];

  const [about, byCategoryBounds, sameGroup] = await Promise.all([
    elementBounds(aboutLink),
    elementBounds(byCategory),
    aboutLink.evaluate((element, labels) => {
      const groupText = element.closest("ul")?.textContent ?? "";

      return labels.every((label) => groupText.includes(label));
    }, primaryLabels),
  ]);

  expect(about.bottom).toBeLessThan(byCategoryBounds.top);
  expect(sameGroup).toBe(true);
});
