import { type Browser, expect, type Page } from "@playwright/test";

export type SellerStep = "CONFIRMED" | "PREPARING" | "SHIPPED" | "DELIVERED";

/** Deja un pedido recién hecho de esa publicación y devuelve la dirección de su ficha. */
export async function placeOrderOf(
  page: Page,
  postSlug: string,
): Promise<string> {
  await page.goto(`/${postSlug}`);
  await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.goto("/carrito");
  await page.getByTestId("cart-confirm").click();
  await expect(page.getByTestId("order-detail")).toBeVisible();

  return page.url();
}

/** Lo lleva por el proceso desde el panel del vendedor, esperando a cada paso. */
export async function advance(
  page: Page,
  statuses: readonly SellerStep[],
): Promise<void> {
  await page.goto("/pedidos");

  for (const status of statuses) {
    await page.getByTestId(`order-action-${status}`).first().click();
    /* Al entregarlo sale del filtro "abiertos" y la lista se vacía: eso ES el comportamiento, así
       que la espera de este paso mira la lista vacía y no la insignia. */
    if (status === "DELIVERED") {
      await expect(page.getByTestId("seller-orders-empty")).toBeVisible();
    } else {
      await expect(
        page.getByTestId("seller-order").first().getByTestId("order-status"),
      ).toHaveAttribute("data-status", status);
    }
  }
}

/** El enlace que el vendedor acaba de recibir al despachar, tras el último clic de `advance`. */
export async function trackingUrlFromLastAdvance(page: Page): Promise<string> {
  const href = await page
    .getByTestId("seller-order")
    .first()
    .getByTestId("courier-link-url")
    .getAttribute("href");

  if (!href) throw new Error("El aviso no trajo el enlace del repartidor.");

  return href;
}

/**
 * El repartidor abre su enlace en un navegador **sin ninguna cookie** —no tiene cuenta— y comparte
 * desde esa posición. Espera a que el servidor confirme el guardado antes de cerrar: cerrar con el
 * envío en vuelo deja al servidor de desarrollo en mal estado.
 */
export async function courierSharesFrom(
  browser: Browser,
  trackingUrl: string,
  position: { latitude: number; longitude: number },
): Promise<void> {
  const context = await browser.newContext({
    geolocation: position,
    permissions: ["geolocation"],
  });
  const courierPage = await context.newPage();

  await courierPage.goto(trackingUrl);
  await courierPage.getByTestId("courier-share-button").click();
  await expect(courierPage.getByTestId("courier-share-active")).toBeVisible();

  await context.close();
}
