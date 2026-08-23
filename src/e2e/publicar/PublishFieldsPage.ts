import type { Locator, Page } from "@playwright/test";
import { openPublishStep } from "../testUtils/openPublishStep";
import { selectWhenHydrated } from "../testUtils/selectWhenHydrated";

/**
 * Los campos de `/publicar`, localizados por su `name`.
 *
 * **Por `name` y no por su rótulo**, y no es pereza. Por rótulo hay ambigüedad real: en cuanto se
 * elige una categoría aparece «Sub-categoría», y cualquier expresión que encuentre a una encuentra
 * a las dos —costó tres escenarios rojos descubrirlo—. Y el `name` es el contrato de verdad de un
 * formulario: es lo que lee la Server Action y lo que reparte `PUBLISH_STEPS`, así que sobrevive a
 * que alguien reescriba la etiqueta, que es justo lo que no debería costar una prueba.
 *
 * Los escenarios que **afirman** algo sobre un rótulo siguen usando `getByRole`: ahí el rótulo es
 * la promesa. Aquí solo se está conduciendo el formulario para llegar a lo que se quiere afirmar.
 */
export default class PublishFieldsPage {
  readonly title: Locator;
  readonly category: Locator;
  readonly phone: Locator;
  readonly content: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('input[name="title"]');
    this.category = page.locator('select[name="category"]');
    this.phone = page.locator('input[name="phone"]');
    this.content = page.locator('textarea[name="content"]');
  }

  /** La categoría es un `select` controlado: hay que esperar a que React esté enganchado. */
  async chooseCategory(key: string): Promise<void> {
    await selectWhenHydrated(this.category, key);
  }

  /** El rótulo de una categoría, tal como lo pone la base. No se copia: se lee de la página. */
  async categoryLabel(key: string): Promise<string> {
    const label = await this.category
      .locator(`option[value="${key}"]`)
      .innerText();

    return label.trim();
  }

  /** Todo lo que hace falta para poder publicar, menos la foto, que es lo único recomendado. */
  async fillEverythingRequired(values: {
    title: string;
    category: string;
    phone: string;
    content: string;
  }): Promise<void> {
    await openPublishStep(this.page, "title");
    await this.title.fill(values.title);
    await this.chooseCategory(values.category);

    await openPublishStep(this.page, "phone");
    await this.phone.fill(values.phone);
    await this.content.fill(values.content);
  }
}
