import { expect, type Locator, type Page } from "@playwright/test";
import type { PublishChecklistItemId } from "~/app/[locale]/publicar/publishChecklist";

/**
 * La columna de `/publicar`: la vista previa y el checklist.
 *
 * Es un page object y no un puñado de `getByTestId` sueltos en el spec por la regla de
 * `AGENTS.md`: el spec afirma **qué promete** la pantalla —«lo que escribo se ve en la tarjeta»— y
 * quien sabe *dónde* mirar es esta clase. Cuando la tarjeta cambie de maquetación, se edita aquí y
 * ningún escenario se entera.
 *
 * Los identificadores de los puntos vienen del tipo del checklist, no de literales: un punto que
 * desaparezca deja de compilar aquí en vez de fallar por tiempo agotado dentro de un escenario.
 */
export default class PublishAsidePage {
  readonly preview: Locator;
  readonly summary: Locator;

  constructor(private readonly page: Page) {
    this.preview = page.getByTestId("publish-preview");
    this.summary = page.getByTestId("publish-checklist-summary");
  }

  check(id: PublishChecklistItemId): Locator {
    return this.page.getByTestId(`publish-check-${id}`);
  }

  /**
   * Si un punto está hecho, leído del atributo y no del tachado.
   *
   * El `line-through` y el verde son la **forma** de decirlo, y cambian con el diseño; `data-done`
   * es lo que el punto afirma. Medir la decoración habría atado el escenario a la hoja de estilos.
   */
  async expectDone(id: PublishChecklistItemId, done: boolean): Promise<void> {
    await expect(this.check(id)).toHaveAttribute(
      "data-done",
      done ? "true" : "false",
    );
  }

  /** Pulsa un punto para que lleve a su campo. */
  async goTo(id: PublishChecklistItemId): Promise<void> {
    await this.check(id).click();
  }
}
