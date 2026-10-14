import { expect, type Locator, type Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { fillWhenHydrated } from "../testUtils/fillWhenHydrated";
import { deleteAndConfirm } from "./confirmDelete";
import { labelled } from "./labelled";

const t = es.outreach;

/** `/admin/difusion/pies` visto por quien la usa: corregir un pie compartido. */
export default class OutreachFooters {
  constructor(private readonly page: Page) {}

  async openEdit(id: string): Promise<void> {
    await this.page.goto(`/admin/difusion/pies/${id}/editar`);
    await expect(this.editForm()).toBeVisible();
  }

  /**
   * El de edición se llama como su encabezado, que lleva el nombre del pie. Sin `exact`, Playwright
   * compara el nombre por subcadena: basta con su principio.
   */
  editForm(): Locator {
    const [prefix] = t.editFooterHeading.split("{name}");

    return this.page.getByRole("form", { name: prefix });
  }

  async replaceBody(body: string): Promise<void> {
    await fillWhenHydrated(
      this.editForm().getByRole("textbox", { name: labelled(t.footerBody) }),
      body,
    );
  }

  async save(): Promise<void> {
    await this.editForm().getByRole("button", { name: t.saveFooter }).click();
    // Guardar lleva a la lista de pies: hasta que se ve, la acción no terminó.
    await expect(this.page.getByTestId("outreach-footers")).toBeVisible();
  }

  /** Desde su edición: confirma y vuelve a la lista de pies. */
  async deleteFooter(): Promise<void> {
    await deleteAndConfirm(this.page, t.deleteFooter, t.footersHeading);
  }

  footer(name: string): Locator {
    return this.page.getByTestId("outreach-footer").filter({ hasText: name });
  }
}
