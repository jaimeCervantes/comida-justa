import { expect, type Page } from "@playwright/test";

/** El panel de moderación: la bandeja de lo que no está publicado. */
export default class ModerationPanelPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/admin/moderacion");
  }

  async expectVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Moderación" }),
    ).toBeVisible();
  }

  row(postId: string) {
    return this.page.getByTestId(`moderation-row-${postId}`);
  }

  /** Baja una publicación con su motivo, como haría un admin desde la bandeja. */
  async reject(postId: string, reason: string): Promise<void> {
    await this.page
      .getByTestId(`moderation-reason-${postId}`)
      .selectOption(reason);
    await this.page.getByTestId(`moderation-reject-${postId}`).click();
    await this.page.waitForLoadState("networkidle");
  }

  async approve(postId: string): Promise<void> {
    await this.page.getByTestId(`moderation-approve-${postId}`).click();
    await this.page.waitForLoadState("networkidle");
  }
}
