import { expect, type Locator, type Page } from "@playwright/test";

export type StoreDraft = {
  name: string;
  phone: string;
  description?: string;
};

/** Page object de `/cuenta`: el alta de vendedor y la tarjeta de la tienda ya creada. */
export default class SellerAccountPage {
  private readonly form: Locator;

  constructor(private readonly page: Page) {
    this.form = this.page.getByRole("form", { name: /abre tu tienda/i });
  }

  async goto(): Promise<void> {
    await this.page.goto("/cuenta");
  }

  async fillAndSubmit(draft: StoreDraft): Promise<void> {
    await this.page
      .getByRole("textbox", { name: /nombre de tu tienda/i })
      .fill(draft.name);
    await this.page
      .getByRole("textbox", { name: /tel[eé]fono de contacto/i })
      .fill(draft.phone);

    if (draft.description) {
      await this.page
        .getByRole("textbox", { name: /qu[eé] vendes/i })
        .fill(draft.description);
    }

    await this.form.getByRole("button", { name: /abrir mi tienda/i }).click();
  }

  /** La dirección que el formulario promete mientras se escribe el nombre. */
  async expectHandlePreview(handle: string): Promise<void> {
    await expect(this.page.getByTestId("handle-preview")).toContainText(
      `/tienda/${handle}`,
    );
  }

  async expectStoreLink(handle: string): Promise<void> {
    await expect(
      this.page.getByRole("link", { name: new RegExp(`/tienda/${handle}$`) }),
    ).toBeVisible();
  }

  async expectStoreCard(name: string): Promise<void> {
    await expect(this.page.getByTestId("store-card")).toContainText(name);
  }

  /**
   * La dirección de la tienda, tal como el 5.15 la quiere: **corta para leer, completa para
   * repartir**.
   *
   * Tras abrir la tienda, la Server Action revalida `/cuenta` y quien acaba de darse de alta
   * aterriza en `StoreCard` — no en ninguna pantalla de «recién creada», que existía en el código y
   * no llegaba a pintarse nunca.
   *
   * Se afirma el enlace y **el disparador** del menú de compartir: `ShareMenu` cuelga su
   * identificador de `${testId}-trigger`, no del `testId` a secas, y buscarlo pelado da cero sin
   * que nada esté roto.
   */
  async expectAddressReadableAndShareable(handle: string): Promise<void> {
    const tarjeta = this.page.getByTestId("store-card");

    await expect(tarjeta).toBeVisible();

    const enlace = tarjeta.getByRole("link", {
      name: new RegExp(`/tienda/${handle}$`),
    });

    /* El camino corto y no la dirección absoluta: es lo que deja sitio al botón de al lado. */
    await expect(enlace).toHaveText(new RegExp(`^/tienda/${handle}$`));
    /* Y se abre aparte, para no perder la cuenta a medio configurar. */
    await expect(enlace).toHaveAttribute("target", "_blank");

    await expect(tarjeta.getByTestId("share-store-trigger")).toBeVisible();
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.page.getByTestId("become-seller-error")).toContainText(
      message,
    );
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.form).toBeVisible();
  }
}
