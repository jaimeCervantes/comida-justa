import { expect, type Page } from "@playwright/test";

/** Page object de la página pública `/tienda/<handle>`. */
export default class StorePage {
  constructor(private readonly page: Page) {}

  async goto(handle: string): Promise<number | undefined> {
    const response = await this.page.goto(`/tienda/${handle}`);

    return response?.status();
  }

  async expectName(name: string): Promise<void> {
    await expect(this.page.getByTestId("store-name")).toHaveText(name);
  }

  async expectPhone(phone: string): Promise<void> {
    await expect(this.page.getByTestId("store-phone")).toHaveText(phone);
  }

  async expectListed(title: string): Promise<void> {
    await expect(
      this.page.getByTestId("store-catalog").getByText(title, { exact: false }),
    ).toBeVisible();
  }

  async expectNotListed(title: string): Promise<void> {
    await expect(
      this.page.getByTestId("store-catalog").getByText(title, { exact: false }),
    ).toHaveCount(0);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.page.getByTestId("store-empty")).toBeVisible();
  }

  /**
   * Cuántas publicaciones enseña el catálogo. Cada tarjeta pone su título en un encabezado, así
   * que contar encabezados dentro de la rejilla es contar tarjetas.
   */
  async expectCatalogCount(count: number): Promise<void> {
    await expect(
      this.page.getByTestId("store-catalog").getByRole("heading"),
    ).toHaveCount(count);
  }

  /**
   * Que la tienda diga a qué distancia queda, sin comprometerse con la cifra.
   *
   * El redondeo y su texto ya los cubre `StoreDistance.test.tsx` en Vitest, que no necesita ni base
   * ni navegador para verificar que 1483 m se dicen "1.5 km". Aquí se comprueba lo que solo se puede
   * comprobar de extremo a extremo: que la distancia **llega** desde PostGIS hasta la pantalla.
   */
  async expectDistanceShown(): Promise<void> {
    await expect(this.page.getByTestId("store-distance")).toBeVisible();
    await expect(this.page.getByTestId("store-distance")).toContainText(/km|m/);
  }

  async expectNoDistance(): Promise<void> {
    await expect(this.page.getByTestId("store-distance")).toHaveCount(0);
  }
}
