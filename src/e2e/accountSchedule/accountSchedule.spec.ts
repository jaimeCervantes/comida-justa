import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import SellerAccountPage from "../sellerStore/SellerAccountPage";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";

const VIEWPORTS = [
  { name: "mobile", size: { width: 390, height: 844 } },
  { name: "desktop", size: { width: 1440, height: 900 } },
] as const;

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
): Promise<void> {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth - documentElement.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

for (const viewport of VIEWPORTS) {
  test.describe(`Cuando una vendedora abre su agenda en ${viewport.name}`, () => {
    let dbSession: DbSession | undefined;
    const store = testStore(`Panadería Agenda Clara ${viewport.name}`);

    test.beforeEach(async ({ page, browserName }) => {
      await page.setViewportSize(viewport.size);
      dbSession = await simulateLogin(page, browserName);

      const account = new SellerAccountPage(page);
      await account.goto();
      await account.fillAndSubmit({ name: store.name, phone: store.phone });
      await account.expectStoreLink(store.handle);
    });

    test.afterEach(async () => {
      await deleteTestSellerByHandle(store.handle);
      if (dbSession?.id) {
        await deleteSession(dbSession.id);
      }
    });

    test("Entonces separa horario semanal y ausencias sin desbordar", async ({
      page,
    }) => {
      await page.goto("/cuenta/agenda");

      await expect(page.getByTestId("schedule-summary")).toBeVisible();

      const weekly = page.getByTestId("weekly-hours-card");
      const timeOff = page.getByTestId("time-off-card");

      await expect(
        weekly.getByRole("heading", {
          level: 2,
          name: es.account.weeklyHoursHeading,
        }),
      ).toBeVisible();
      await expect(
        timeOff.getByRole("heading", {
          level: 2,
          name: es.account.timeOffHeading,
        }),
      ).toBeVisible();

      await expect(page.getByTestId("schedule-empty")).toBeVisible();
      await page.getByTestId("schedule-add").click();
      await expect(page.getByTestId("schedule-row-0")).toBeVisible();

      await expect(page.getByTestId("time-off-empty")).toBeVisible();
      await expect(page.getByTestId("time-off-add")).toBeVisible();

      await expectNoHorizontalOverflow(page);
    });
  });
}
