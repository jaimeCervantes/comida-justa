import { expect, type Locator, type Page } from "@playwright/test";

/**
 * La ficha de una publicación, vista como el sitio donde se lleva su inventario.
 *
 * Existe para que los escenarios digan *qué* pasa y no *dónde hay que hacer clic*: abrir, escribir
 * un número, guardar y leer lo que quedó son cuatro frases que se repiten en los ocho escenarios
 * del slice. Cuando el inventario tenga además su panel de tienda (slice 2), lo que cambie será
 * este archivo y no los escenarios.
 */
export class PostInventory {
  constructor(
    private readonly page: Page,
    private readonly slug: string,
  ) {}

  async open(): Promise<void> {
    await this.page.goto(`/${this.slug}`);
  }

  get control(): Locator {
    return this.page.getByTestId("stock-control");
  }

  get input(): Locator {
    return this.page.getByTestId("stock-input");
  }

  /** Lo que ve un visitante cualquiera: "Quedan 3 unidades". Ausente si nadie lleva la cuenta. */
  get remaining(): Locator {
    return this.page.getByTestId("stock-remaining");
  }

  get soldOutBadge(): Locator {
    return this.page.getByTestId("sold-out-badge");
  }

  /** El botón de agotar a mano, que desaparece en cuanto el producto lleva inventario. */
  get manualSoldOutButton(): Locator {
    return this.page
      .getByTestId("owner-controls")
      .getByRole("button", { name: /agotado|disponible/i });
  }

  get orderButton(): Locator {
    return this.page.getByTestId("whatsapp-order");
  }

  /**
   * Escribe el número y guarda, y no vuelve hasta que la acción terminó.
   *
   * La espera es el botón: `isLoading` lo deshabilita mientras la acción corre y lo suelta al
   * acabar, así que esperar a que vuelva a estar habilitado es esperar a que se haya guardado
   * — sin esperas por tiempo y sin depender de qué pinta la página después, que es distinto en
   * cada escenario (un número, una insignia de agotado, un error).
   *
   * El plazo es largo y explícito porque guardar invalida el layout entero —agotar algo cambia su
   * tarjeta en todos los listados— y en el servidor de desarrollo esa recompilación se pasa de los
   * cinco segundos por omisión. Es sincronización, no una aserción: lo que el escenario afirma
   * viene después.
   */
  async save(quantity: string): Promise<void> {
    const submit = this.control.getByRole("button");

    await this.input.fill(quantity);
    await submit.click();
    await expect(submit).toBeEnabled({ timeout: 30_000 });
  }
}
