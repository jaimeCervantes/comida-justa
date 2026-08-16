import { expect, type Page } from "@playwright/test";

/**
 * Las dos pantallas de la moderación, que son dos porque el recorrido tiene dos mitades:
 *
 * - **La publicación**: donde el admin se topa con algo que no cumple y lo baja.
 * - **El panel** (`/admin/moderacion`): la bandeja de lo que ya no está publicado, para restituir.
 *
 * El panel NO lista lo publicado a propósito, así que bajar algo no se puede hacer desde ahí.
 */
export default class ModerationPanelPage {
  constructor(private readonly page: Page) {}

  async gotoPanel(): Promise<void> {
    await this.page.goto("/admin/moderacion");
  }

  async gotoPost(slug: string): Promise<void> {
    await this.page.goto(`/${slug}`);
  }

  async expectPanelVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Moderación" }),
    ).toBeVisible();
  }

  /**
   * Baja la publicación que se está viendo, con su motivo.
   *
   * Espera al **efecto visible** —el aviso, que la ficha pinta en cuanto deja de estar publicada—
   * y no a `networkidle`. Ese se resolvía con la carga de la propia ficha en vez de con la
   * respuesta de la acción, así que la prueba seguía antes de que la escritura hubiera aterrizado y
   * fallaba de forma intermitente según lo que hiciera después.
   */
  async rejectFromPost(reason: string): Promise<void> {
    await this.page.getByTestId("moderation-reason").selectOption(reason);
    await this.page.getByTestId("moderation-reject").click();

    await expect(this.page.getByTestId("moderation-notice")).toBeVisible();
  }

  /** La restituye desde la bandeja: la fila desaparece porque deja de estar sin publicar. */
  async approveFromPanel(postId: string): Promise<void> {
    await this.page.getByTestId(`moderation-approve-${postId}`).click();

    await expect(this.row(postId)).toHaveCount(0);
  }

  row(postId: string) {
    return this.page.getByTestId(`moderation-row-${postId}`);
  }
}
