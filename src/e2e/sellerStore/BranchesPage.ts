import { expect, type Locator, type Page } from "@playwright/test";

export type BranchDraft = {
  name: string;
  address: string;
  mapUrl: string;
};

/** Page object del alta de sucursales en `/cuenta` y de su listado en la tienda. */
export default class BranchesPage {
  private readonly form: Locator;

  constructor(private readonly page: Page) {
    this.form = this.page.getByRole("form", { name: /agrega una sucursal/i });
  }

  async gotoAccount(): Promise<void> {
    await this.page.goto("/cuenta");
  }

  async gotoStore(handle: string): Promise<void> {
    await this.page.goto(`/tienda/${handle}`);
  }

  async addBranch(draft: BranchDraft): Promise<void> {
    await this.page
      .getByRole("textbox", { name: /nombre de la sucursal/i })
      .fill(draft.name);
    await this.page
      .getByRole("textbox", { name: /direcci[oó]n/i })
      .fill(draft.address);
    await this.page
      .getByRole("textbox", { name: /enlace de google maps/i })
      .fill(draft.mapUrl);

    await this.form.getByRole("button", { name: /guardar sucursal/i }).click();
  }

  async expectListed(name: string): Promise<void> {
    await expect(
      this.page.getByTestId("branch-list").getByText(name, { exact: false }),
    ).toBeVisible();
  }

  async expectError(message: RegExp): Promise<void> {
    await expect(this.page.getByTestId("add-branch-error")).toContainText(
      message,
    );
  }

  async expectNoBranches(): Promise<void> {
    await expect(this.page.getByTestId("branches-empty")).toBeVisible();
  }
}
