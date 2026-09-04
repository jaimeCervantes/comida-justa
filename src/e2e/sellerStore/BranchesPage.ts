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

  /**
   * Despliega el alta si viene plegada.
   *
   * Desde el slice 2 de `005-2026-09-04-cuenta-configurable` el formulario llega plegado en cuanto
   * hay al menos una sucursal, así que **dar de alta la segunda pide un clic que antes no
   * existía**. Lo destapó el escenario de «puede tener más de una»: escribía en campos ocultos y
   * fallaba. Se pregunta por el `open` del `<details>` en vez de por la visibilidad del campo
   * porque es el dato que decide, y así el page object no adivina.
   */
  private async openForm(): Promise<void> {
    const disclosure = this.page.getByTestId("add-branch");

    await expect(disclosure).toBeVisible();

    const isOpen = await disclosure.evaluate(
      (element) => (element as HTMLDetailsElement).open,
    );

    if (!isOpen) {
      await this.page.getByTestId("add-branch-toggle").click();
    }

    await expect(
      this.page.getByRole("textbox", { name: /nombre de la sucursal/i }),
    ).toBeVisible();
  }

  async addBranch(draft: BranchDraft): Promise<void> {
    await this.openForm();

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
