import {
  devices,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";

type SectionCase = {
  origin: string;
  section: string;
  destination: RegExp;
};

const spanishSections: SectionCase[] = [
  {
    origin: "/nosotros",
    section: es.nav.pillarsMenu,
    destination: /\/pilares\/?$/,
  },
  {
    origin: "/nosotros",
    section: es.nav.communityMenu,
    destination: /^http:\/\/localhost:\d+\/?$/,
  },
];

const englishSections: SectionCase[] = [
  {
    origin: "/en/about",
    section: en.nav.pillarsMenu,
    destination: /\/en\/pillars\/?$/,
  },
  {
    origin: "/en/about",
    section: en.nav.communityMenu,
    destination: /\/en\/?$/,
  },
];

const spanishSubmenus = [
  {
    section: es.nav.pillarsMenu,
    openLabel: `Abrir el submenú de ${es.nav.pillarsMenu}`,
    destination: es.pillars.sleep.title,
  },
  {
    section: es.nav.communityMenu,
    openLabel: `Abrir el submenú de ${es.nav.communityMenu}`,
    destination: es.nav.publications,
  },
] as const;

function desktopMenu(page: Page): Locator {
  return page.getByTestId("desktop-menu");
}

function mobileMenu(page: Page): Locator {
  return page.getByTestId("mobile-menu");
}

async function openMobileMenu(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: es.nav.openMenu }).click();
  const menu = mobileMenu(page);
  await expect(menu).toBeVisible();
  return menu;
}

test.describe("Los títulos de sección del menú de escritorio", () => {
  for (const { origin, section, destination } of [
    ...spanishSections,
    ...englishSections,
  ]) {
    test(`${section} lleva a su portada`, async ({ page }) => {
      await page.goto(origin);

      await desktopMenu(page)
        .getByRole("link", { name: section, exact: true })
        .click();

      await expect(page).toHaveURL(destination);
    });
  }

  for (const { section, openLabel, destination } of spanishSubmenus) {
    test(`la flecha de ${section} abre sus destinos`, async ({ page }) => {
      await page.goto("/nosotros");

      await desktopMenu(page)
        .getByRole("button", { name: openLabel, exact: true })
        .click();

      await expect(page).toHaveURL(/\/nosotros\/?$/);
      await expect(
        desktopMenu(page).getByRole("link", {
          name: destination,
        }),
      ).toBeVisible();
    });
  }
});

test.describe("Los títulos de sección del menú móvil", () => {
  test.use({ viewport: devices["Pixel 5"].viewport });

  for (const { origin, section, destination } of spanishSections) {
    test(`${section} lleva a su portada`, async ({ page }) => {
      await page.goto(origin);
      const menu = await openMobileMenu(page);

      await menu.getByRole("link", { name: section, exact: true }).click();

      await expect(page).toHaveURL(destination);
    });
  }

  for (const { section, openLabel, destination } of spanishSubmenus) {
    test(`la flecha de ${section} abre sus destinos`, async ({ page }) => {
      await page.goto("/nosotros");
      const menu = await openMobileMenu(page);

      await menu.getByRole("button", { name: openLabel, exact: true }).click();

      await expect(page).toHaveURL(/\/nosotros\/?$/);
      await expect(
        menu.getByRole("link", { name: destination, exact: true }),
      ).toBeVisible();
    });
  }
});
