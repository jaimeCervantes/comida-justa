import { expect, type Page } from "@playwright/test";

/** Page object de la página pública `/tienda/<handle>`. */
export default class StorePage {
  constructor(private readonly page: Page) {}

  async goto(handle: string): Promise<number | undefined> {
    const response = await this.page.goto(`/tienda/${handle}`);

    return response?.status();
  }

  async expectName(name: string): Promise<void> {
    await expect(this.page.getByTestId("store-name")).toHaveText(name);
  }

  async expectPhone(phone: string): Promise<void> {
    await expect(this.page.getByTestId("store-phone")).toHaveText(phone);
  }

  async expectListed(title: string): Promise<void> {
    await expect(
      this.page.getByTestId("store-catalog").getByText(title, { exact: false }),
    ).toBeVisible();
  }

  async expectEmpty(): Promise<void> {
    await expect(this.page.getByTestId("store-empty")).toBeVisible();
  }
}
