import { expect, Locator, Page } from "@playwright/test";

export default class CommentPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly commentInput: Locator;
  readonly submitButton: Locator;
  readonly commentsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = this.page.getByRole("button", {
      name: /iniciar sesión/i,
    });
    this.commentInput = this.page.getByRole("textbox", {
      name: /Escribe tu comentario/i,
    });
    this.submitButton = this.page.getByRole("button", {
      name: /Agregar Comentario/i,
    });
    this.commentsList = this.page.getByRole("list", { name: /Comentarios/i });
  }

  async goToPost(slug: string) {
    await this.page.goto(`/${slug}`);
  }

  async fillComment(comment: string) {
    await this.commentInput.fill(comment);
  }

  async submitComment() {
    await this.submitButton.click();
  }

  async verifyCommentDisplayed(comment: string) {
    await expect(this.commentsList).toContainText(comment);
  }

  async verifyCommentAuthor(author: string) {
    const commentAuthor = this.commentsList.getByText(author).first();
    await expect(commentAuthor).toBeVisible();
  }
}
