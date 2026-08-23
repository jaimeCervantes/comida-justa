import { expect, type Locator, type Page } from "@playwright/test";
import { publishShowsPrice } from "~/app/[locale]/publicar/publishChecklist";
import { choosePublishKind } from "../testUtils/choosePublishKind";
import { openPublishStep } from "../testUtils/openPublishStep";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";

type PublishValues = {
  title: string;
  price: string;
  file: string;
  phone: string;
  description: string;
  kind: "anuncio" | "producto";
  origin: string;
  category?: string;
  subCategory?: string;
};

/**
 * Page object del slice 1 del catálogo unificado: publicar con categoría y leer su etiqueta.
 * La categoría se elige después de fijar el tipo de publicación porque la sub-categoría se
 * encadena a ella, no porque el tipo la haga aparecer: se pregunta en los dos kinds.
 */
export default class UnifiedCatalogPage {
  private readonly form: Locator;

  constructor(private readonly page: Page) {
    this.form = this.page.getByRole("form").first();
  }

  async stubStorageUpload() {
    await stubStorageUpload(this.page);
  }

  async goto() {
    await this.page.goto("/publicar");
  }

  /**
   * Rellena el formulario cruzando el asistente.
   *
   * Desde el 5.3, `/publicar` son tres pasos y los campos de los pasos que no se ven llevan
   * `hidden`. Quién vive en qué paso lo sabe `openPublishStep`, que lo deriva de `PUBLISH_STEPS`:
   * aquí no hay una segunda copia del reparto.
   */
  async fill(values: PublishValues) {
    await openPublishStep(this.page, "title");
    await this.page
      .getByRole("textbox", { name: /t[ií]tulo de la publicación/i })
      .fill(values.title);
    /* El tipo va primero: es lo que decide qué campos existen. El formulario abre en `anuncio`,
       y un anuncio no pinta ni precio ni procedencia —son campos de lo que se vende—, así que
       llenarlos antes de elegirlo es esperar a un campo que todavía no está en la página. */
    await choosePublishKind(this.page, values.kind);

    if (values.category) {
      await this.page
        .getByRole("combobox", { name: /^categoría/i })
        .selectOption(values.category);
    }

    if (values.subCategory) {
      await this.page
        .getByRole("combobox", { name: /sub-categoría/i })
        .selectOption(values.subCategory);
    }

    // Por `#origin` y no por su etiqueta: la etiqueta es una pregunta al vendedor y se redacta de
    // nuevo cada vez que se afina el tono. El id es el contrato del campo.
    if (values.kind === "producto") {
      await openPublishStep(this.page, "origin");
      await this.page.locator("#origin").selectOption(values.origin);
    }

    if (publishShowsPrice(values.kind)) {
      await openPublishStep(this.page, "price");
      await this.page
        .getByRole("spinbutton", { name: /precio/i })
        .fill(values.price);
    }

    await openPublishStep(this.page, "phone");
    await this.page
      .getByRole("textbox", { name: /tel[eé]fono/i })
      .fill(values.phone);
    await this.page
      .getByRole("textbox", { name: /descripci[oó]n/i })
      .fill(values.description);

    // El archivo va al final: dispara un `change` nativo que solo inicia la subida una vez
    // que React hidrató y enganchó su onChange.
    await this.page
      .locator('form input[type="file"]')
      .setInputFiles(values.file);
  }

  async submit() {
    // Publicar vive en el último paso del asistente.
    await openPublishStep(this.page, "phone");
    await expect(this.page.getByText(/subido/i)).toBeVisible({
      timeout: 45_000,
    });
    const submitButton = this.form.getByRole("button", {
      name: "Publicar",
      exact: true,
    });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  /**
   * La insignia de categoría **de la ficha**, no la de cualquier tarjeta.
   *
   * Antes buscaba en toda la página y funcionaba de casualidad: en inglés las publicaciones
   * relacionadas no se pintaban —su semilla se buscaba por slug y en inglés no existía—, así que
   * solo había una insignia. Al arreglar ese bug aparecieron cinco y el locator se volvió ambiguo.
   */
  categoryTag() {
    return this.page.getByTestId("post-detail").getByTestId("category-tag");
  }

  /**
   * La categoría se pregunta sea cual sea el tipo de publicación; la sub-categoría no aparece
   * hasta que hay una categoría elegida, porque la base rechaza la huérfana.
   */
  /** La categoría, mirada en su paso: desde el asistente, lo de otro paso está `hidden`. */
  async expectCategoryOffered() {
    await openPublishStep(this.page, "category");
    await expect(
      this.page.getByRole("combobox", { name: /^categoría/i }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("combobox", { name: /sub-categoría/i }),
    ).toHaveCount(0);
  }

  /** La procedencia describe algo que se vende, así que solo la pide un producto. */
  origin() {
    return this.page.locator("#origin");
  }

  /**
   * Si al formulario le importa la procedencia, **mirándola donde vive**.
   *
   * «No se pregunta» sigue siendo «no está en la página»; «sí se pregunta» pasó a ser «está en su
   * paso y se puede rellenar», porque desde el asistente un campo del segundo paso está `hidden`
   * hasta que se llega a él. El escenario afirma la promesa; llegar hasta el campo es cosa de aquí.
   */
  async expectOriginOffered(offered: boolean) {
    if (!offered) {
      await expect(this.origin()).toHaveCount(0);
      return;
    }

    await openPublishStep(this.page, "origin");
    await expect(this.origin()).toBeVisible();
  }
}
