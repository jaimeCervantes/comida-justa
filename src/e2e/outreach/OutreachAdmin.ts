import { expect, type Locator, type Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { fillWhenHydrated } from "../testUtils/fillWhenHydrated";
import { deleteAndConfirm } from "./confirmDelete";
import { labelled } from "./labelled";

const t = es.outreach;

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
    await fillWhenHydrated(
      form.getByRole("textbox", { name: labelled(t.nameLabel) }),
      name,
    );
    await fillWhenHydrated(
      form.getByRole("textbox", { name: labelled(t.openingLabel) }),
      opening,
    );
    await fillWhenHydrated(
      form.getByRole("textbox", { name: labelled(t.closingLabel) }),
      closing,
    );
  }

  /**
   * Sin pie. Una publicación nueva arranca con el único pie que haya, y en la base compartida puede
   * estar el de verdad: quien quiere el texto sin pie lo dice, no lo supone.
   */
  async chooseNoFooter(form: Locator): Promise<void> {
    await form
      .getByRole("combobox", { name: labelled(t.footerLabel) })
      .selectOption({ label: t.footerNone });
  }

  /** Busca el producto por su título, lo agrega y le pone la etiqueta y el emoji de la lista. */
  async addProduct(
    form: Locator,
    { title, label, emoji }: { title: string; label: string; emoji: string },
  ): Promise<void> {
    await fillWhenHydrated(
      form.getByRole("searchbox", { name: t.searchLabel }),
      title,
    );
    await form
      .getByTestId("outreach-product-match")
      .filter({ hasText: title })
      .getByRole("button", { name: t.addProduct })
      .click();

    await this.setItem(form, title, { label, emoji });
  }

  /** Escribe en el buscador del formulario; los resultados llegan del servidor al dejar de teclear. */
  async searchProducts(form: Locator, term: string): Promise<void> {
    await fillWhenHydrated(
      form.getByRole("searchbox", { name: t.searchLabel }),
      term,
    );
  }

  /** Un resultado del buscador por lo que dice: título y precio. */
  productMatch(form: Locator, text: string): Locator {
    return form.getByTestId("outreach-product-match").filter({ hasText: text });
  }

  async setItem(
    form: Locator,
    title: string,
    { label, emoji }: { label: string; emoji?: string },
  ): Promise<void> {
    const row = form.getByTestId("outreach-item").filter({ hasText: title });

    await fillWhenHydrated(
      row.getByRole("textbox", { name: labelled(t.itemLabel) }),
      label,
    );
    if (emoji !== undefined) {
      await fillWhenHydrated(
        row.getByRole("textbox", { name: t.itemEmoji }),
        emoji,
      );
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

  /** Lo de un grupo normal: el texto completo, su «Copiar» y sus fotos. */
  groupPost(): Locator {
    return this.page.getByTestId("outreach-group-post");
  }

  /**
   * El «Copiar» del texto completo. `exact`, y dentro de su sección: en la misma página están
   * «Copiar título», «Copiar precio» y «Copiar descripción», y el nombre se compara por subcadena.
   */
  copyButton(): Locator {
    return this.groupPost().getByRole("button", { name: t.copy, exact: true });
  }

  copyFeedback(): Locator {
    return this.groupPost().getByTestId("outreach-copy-feedback");
  }

  listings(): Locator {
    return this.page.getByTestId("outreach-listings");
  }

  listing(title: string): Locator {
    return this.listings()
      .getByTestId("outreach-listing")
      .filter({ hasText: title });
  }

  /** Los artículos de compraventa como se leen: título y precio, en su orden. */
  async readListings(): Promise<Array<{ title: string; price: string }>> {
    const cards = this.listings().getByTestId("outreach-listing");
    const result: Array<{ title: string; price: string }> = [];

    for (const card of await cards.all()) {
      result.push({
        title:
          (await card.getByTestId("outreach-listing-title").textContent()) ??
          "",
        price:
          (await card.getByTestId("outreach-listing-price").textContent()) ??
          "",
      });
    }

    return result;
  }

  async copyListingTitle(title: string): Promise<void> {
    await this.listing(title)
      .getByRole("button", { name: t.copyTitle })
      .click();
  }

  async copyListingPrice(title: string): Promise<void> {
    await this.listing(title)
      .getByRole("button", { name: t.copyPrice })
      .click();
  }

  async copyListingDescription(): Promise<void> {
    await this.listings()
      .getByTestId("outreach-listing-description")
      .getByRole("button", { name: t.copyDescription })
      .click();
  }

  /** Los enlaces a las fotos de un artículo: cada uno abre la original en otra pestaña. */
  listingPhotoLinks(title: string): Locator {
    return this.listing(title).getByRole("link", {
      name: t.openPhoto.replace("{title}", title),
    });
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

  // --- Los grupos y el historial ----------------------------------------------------------

  /** El enlace que abre un grupo, dentro de la sección de su tipo. */
  channelLink(section: Locator, name: string): Locator {
    return this.channelRow(section, name).getByRole("link");
  }

  /** «2. Publica en cada grupo y márcalo»: los grupos normales, uno por renglón. */
  publishStep(): Locator {
    return this.groupPost().getByRole("region", {
      name: t.stepPublishHeading,
    });
  }

  /** El renglón de un grupo normal: su enlace, su turno, sus reglas, su última vez y su casilla. */
  publishRow(name: string): Locator {
    return this.markable(this.publishStep(), name);
  }

  /** «Hoy les toca a 2 de 3 grupos.», arriba de la publicación. */
  dueChannels(): Locator {
    return this.page.getByTestId("outreach-due-channels");
  }

  /** Un grupo en un formulario de «marcar como publicada»: su casilla y su última vez. */
  private markable(scope: Locator, name: string): Locator {
    return scope.getByTestId("outreach-channel").filter({ hasText: name });
  }

  postChannelLast(name: string): Locator {
    return this.markable(this.groupPost(), name).getByTestId(
      "outreach-channel-last",
    );
  }

  listingChannelLast(title: string, name: string): Locator {
    return this.markable(this.listing(title), name).getByTestId(
      "outreach-channel-last",
    );
  }

  async markPostPublished(names: readonly string[]): Promise<void> {
    await this.mark(this.groupPost(), names, t.markPostPublished);
  }

  async markListingPublished(
    title: string,
    names: readonly string[],
  ): Promise<void> {
    await this.mark(this.listing(title), names, t.markListingPublished);
  }

  private async mark(
    scope: Locator,
    names: readonly string[],
    submit: string,
  ): Promise<void> {
    for (const name of names) {
      await this.markable(scope, name).getByRole("checkbox").check();
    }
    await scope.getByRole("button", { name: submit }).click();
  }

  /** El botón de marcar la línea entera: el tope del día avisa, pero no lo apaga. */
  markPostButton(): Locator {
    return this.groupPost().getByRole("button", {
      name: t.markPostPublished,
    });
  }

  // --- El ritmo -----------------------------------------------------------------------------

  /**
   * El renglón de un grupo con su turno. En grupos normales es el mismo que se marca
   * (`outreach-channel`, desde el slice 7); en compraventa, el de la lista de grupos de arriba
   * (`outreach-channel-link`), porque ahí se marca por pan. Los renglones de marcar de cada pan no
   * llevan turno ni enlace, así que lo que se busca dentro de este solo aparece una vez.
   */
  private channelRow(section: Locator, name: string): Locator {
    return section
      .locator(
        '[data-testid="outreach-channel-link"], [data-testid="outreach-channel"]',
      )
      .filter({ hasText: name });
  }

  /** «Ya le toca» o «Todavía no: en N días», junto al enlace del grupo. */
  channelTurn(section: Locator, name: string): Locator {
    return this.channelRow(section, name).getByTestId("outreach-channel-turn");
  }

  /** «Hoy toca: …», solo en los grupos de compraventa. */
  channelSuggestion(name: string): Locator {
    return this.channelRow(this.listings(), name).getByTestId(
      "outreach-channel-suggestion",
    );
  }

  dailyPace(): Locator {
    return this.page.getByTestId("outreach-daily-pace");
  }

  // --- Las versiones ------------------------------------------------------------------------

  /** El texto armado de cada versión, en orden: solo aparecen si hay más de una. */
  versionTexts(): Locator {
    return this.groupPost().getByTestId("outreach-version-text");
  }

  /** «Le toca la versión 2», junto al enlace de un grupo normal. */
  versionTurn(name: string): Locator {
    return this.channelRow(this.groupPost(), name).getByTestId(
      "outreach-channel-version",
    );
  }

  /** «Acabas de publicar: espera…»: solo aparece dentro de la pausa. */
  pauseNotice(): Locator {
    return this.page.getByTestId("outreach-pause");
  }

  /** Desde su edición: confirma y vuelve a la lista de publicaciones. */
  async deleteText(): Promise<void> {
    await deleteAndConfirm(this.page, t.deleteText, t.listHeading);
  }

  /** Una publicación en la lista; `exact` porque «Masa madre» es principio de otros nombres. */
  listedText(name: string): Locator {
    return this.page
      .getByTestId("outreach-texts")
      .getByRole("link", { name, exact: true });
  }
}
