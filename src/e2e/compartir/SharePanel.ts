import { expect, type Locator, type Page } from "@playwright/test";
import type { ShareNetwork } from "~/domain/sharing/shareTargets";

/**
 * Page object del botón de compartir, que es el mismo en la tienda y en el perfil.
 *
 * Se distingue por su `testId`, no por su posición: en `/cuenta` hay dos a la vez y localizarlos
 * "el primero" / "el segundo" los ataría al orden de las columnas.
 */
export default class SharePanel {
  constructor(
    private readonly page: Page,
    private readonly testId: string,
  ) {}

  async open(): Promise<void> {
    await this.page.getByTestId(`${this.testId}-trigger`).click();
  }

  private target(network: ShareNetwork): Locator {
    return this.page.getByTestId(`share-${network}`);
  }

  /**
   * Afirma sobre el **camino** de la dirección compartida y no sobre la absoluta entera.
   *
   * El origen depende del puerto en el que corra la suite (`E2E_PORT`), así que fijar
   * `http://localhost:3000` haría rojo un cambio de puerto sin que nada esté roto. Lo que la regla
   * promete es que el enlace viaja codificado, y eso se ve igual de bien en el camino.
   */
  async expectTargetCarries(
    network: ShareNetwork,
    { path, text }: { path: string; text?: string },
  ): Promise<void> {
    const href = await this.target(network).getAttribute("href");

    expect(href).toContain(encodeURIComponent(path));

    if (text) {
      expect(href).toContain(encodeURIComponent(text));
    }
  }

  async copyLink(): Promise<void> {
    await this.page.getByTestId("share-copy").click();
  }

  async expectCopyConfirmed(): Promise<void> {
    await expect(this.page.getByTestId("share-feedback")).toBeVisible();
  }

  async readClipboard(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}

/**
 * Quita `navigator.share` **antes** de que cargue la página.
 *
 * Sin esto la suite depende de si el Chromium del runner trae la hoja nativa —en Windows la trae—,
 * y el componente ofrecería la hoja del sistema en vez del menú: un diálogo del sistema operativo
 * que Playwright no puede cerrar dejaría la prueba colgada hasta el timeout. El camino nativo se
 * cubre con Vitest, donde se puede sustituir de verdad; aquí se prueba el de escritorio.
 *
 * Se define como propiedad propia del objeto porque `share` vive en `Navigator.prototype`, y un
 * `delete` sobre la instancia no lo alcanzaría.
 */
export async function withoutNativeShare(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
  });
}
