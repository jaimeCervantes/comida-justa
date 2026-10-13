import { expect, type Locator, type Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";

const t = es.outreach;

/** Una etiqueta de campo seguida, quizá, del `*` de obligatorio. */
function labelled(text: string): RegExp {
  return new RegExp(`^${text}`);
}

/**
 * `/admin/difusion` visto por quien la usa: el formulario, el texto para grupos y sus avisos.
 *
 * Todo se busca dentro de su región (`data-testid`) o del formulario por su nombre, nunca suelto
 * en la página: el menú del avatar y el pie repiten palabras como «Editar».
 */
export default class OutreachAdmin {
  constructor(private readonly page: Page) {}

  async openNew(): Promise<void> {
    await this.page.goto("/admin/difusion/nueva");
    await expect(this.form(t.newHeading)).toBeVisible();
  }

  async open(id: string): Promise<void> {
    await this.page.goto(`/admin/difusion/${id}`);
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  async openEdit(id: string): Promise<void> {
    await this.page.goto(`/admin/difusion/${id}/editar`);
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  form(name: string): Locator {
    return this.page.getByRole("form", { name });
  }

  /**
   * El de edición se llama como su encabezado, que lleva el nombre del texto («Editar «E2E Masa
   * madre …»»). Se busca por el principio: el buscador del encabezado también es un formulario, y un
   * `getByRole("form")` sin nombre no sabría cuál de los dos es.
   */
  editForm(): Locator {
    const [prefix] = t.editHeading.split("{name}");

    // Sin `exact`, Playwright compara el nombre por subcadena: basta con su principio.
    return this.page.getByRole("form", { name: prefix });
  }

  async fillText(
    form: Locator,
    {
      name,
      opening,
      closing,
    }: { name: string; opening: string; closing: string },
  ): Promise<void> {
    await form.getByRole("textbox", { name: labelled(t.nameLabel) }).fill(name);
    await form
      .getByRole("textbox", { name: labelled(t.openingLabel) })
      .fill(opening);
    await form
      .getByRole("textbox", { name: labelled(t.closingLabel) })
      .fill(closing);
  }

  /** Busca el producto por su título, lo agrega y le pone la etiqueta y el emoji de la lista. */
  async addProduct(
    form: Locator,
    { title, label, emoji }: { title: string; label: string; emoji: string },
  ): Promise<void> {
    await form.getByRole("searchbox", { name: t.searchLabel }).fill(title);
    await form
      .getByTestId("outreach-product-match")
      .filter({ hasText: title })
      .getByRole("button", { name: t.addProduct })
      .click();

    await this.setItem(form, title, { label, emoji });
  }

  async setItem(
    form: Locator,
    title: string,
    { label, emoji }: { label: string; emoji?: string },
  ): Promise<void> {
    const row = form.getByTestId("outreach-item").filter({ hasText: title });

    await row.getByRole("textbox", { name: labelled(t.itemLabel) }).fill(label);
    if (emoji !== undefined) {
      await row.getByRole("textbox", { name: t.itemEmoji }).fill(emoji);
    }
  }

  async save(form: Locator): Promise<void> {
    await form.getByRole("button", { name: t.save }).click();
    // Guardar lleva al texto armado: hasta que se ve, la acción no terminó.
    await expect(this.text().or(this.nothingToAnnounce())).toBeVisible();
  }

  text(): Locator {
    return this.page.getByTestId("outreach-text");
  }

  /** El texto exacto, renglón por renglón: `toHaveText` aplasta los espacios y aquí cuentan. */
  async readText(): Promise<string> {
    return (await this.text().textContent()) ?? "";
  }

  copyButton(): Locator {
    return this.page.getByRole("button", { name: t.copy });
  }

  copyFeedback(): Locator {
    return this.page.getByTestId("outreach-copy-feedback");
  }

  /**
   * Lo que quedó en el portapapeles, con los saltos de renglón como `\n`.
   *
   * El portapapeles de Windows guarda el texto con `\r\n` y Chromium lo devuelve así al leerlo,
   * aunque se haya escrito con `\n`. Es del sistema operativo, no de la app —al pegar en Facebook da
   * igual—, y sin normalizar la prueba fallaría en Windows y pasaría en el CI.
   */
  async readClipboard(): Promise<string> {
    const text = await this.page.evaluate(() => navigator.clipboard.readText());

    return text.replace(/\r\n/g, "\n");
  }

  excluded(): Locator {
    return this.page.getByTestId("outreach-excluded");
  }

  nothingToAnnounce(): Locator {
    return this.page.getByTestId("outreach-nothing");
  }
}
