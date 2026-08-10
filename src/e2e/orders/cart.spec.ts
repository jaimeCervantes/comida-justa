import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/* Datos REALES del catálogo (2026-08-09): "Suero natural" a 35, de Hazlo Sano, cuyo teléfono en
   `sellers` es 2781126948. No se siembra nada para probar que el carrito suma bien. */
const SUERO_NATURAL = {
  slug: "suero-natural",
  title: "Suero natural",
  price: 35,
};
const HAZLO_SANO = { handle: "hazlo-sano", whatsapp: "522781126948" };

/* El producto que se añade DESDE UNA TARJETA se siembra, en vez de usar uno de los 13 reales.
   `/productos` pagina y ordena por fecha, así que un producto real puede caer en la página 3 y el
   escenario fallaría por dónde quedó, no por lo que prueba. Sembrado con la fecha de hoy, sale
   primero. Va dentro de la tienda de Hazlo Sano para que los dos renglones compartan grupo, que es
   lo que el escenario quiere comprobar. */
const seeded = {
  title: `E2E Agua fresca ${Date.now()}`,
  slug: testSlug("agua-fresca"),
  kind: "producto" as const,
  origin: null,
  price: 40,
  sellerHandle: HAZLO_SANO.handle,
};

/**
 * Añade desde la ficha y **espera a que la cabecera lo cuente**.
 *
 * Esperar a que el contador exista no basta: a partir del segundo añadido ya existe, así que la
 * aserción pasaba sin esperar nada y la navegación siguiente se adelantaba a la acción de servidor
 * —la cookie aún no estaba escrita y el carrito salía corto—. El número es lo que de verdad
 * sincroniza.
 *
 * El localizador va acotado a `post-detail` porque la ficha termina con las publicaciones
 * relacionadas, y cada una de esas tarjetas trae su propio botón de añadir.
 */
async function addFromDetail(
  page: Page,
  slug: string,
  expectedCount: number,
): Promise<void> {
  await page.goto(`/${slug}`);
  await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText(
    String(expectedCount),
  );
}

async function cartTotal(page: Page): Promise<string> {
  return (await page.getByTestId("cart-group-total").innerText()).trim();
}

test.describe("Cuando el comprador junta varios productos", () => {
  test.beforeEach(async () => {
    await seedPost(seeded);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(seeded.slug);
  });

  test("Entonces los dos quedan en un solo pedido, agrupados por tienda", async ({
    page,
  }) => {
    await addFromDetail(page, SUERO_NATURAL.slug, 1);

    // El segundo entra desde su tarjeta en el listado, sin abrir la publicación.
    await page.goto("/productos");
    await page
      .locator("article")
      .filter({ hasText: seeded.title })
      .getByTestId("add-to-cart")
      .click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.goto("/carrito");

    await expect(page.getByTestId("cart-line")).toHaveCount(2);
    await expect(page.getByTestId("cart-group")).toHaveCount(1);
    await expect(page.getByTestId("cart-group")).toContainText("Hazlo Sano");
    // 35 del suero + 40 del sembrado.
    expect(await cartTotal(page)).toContain("75");
  });

  test("Entonces la cabecera dice lo que llevo, esté donde esté", async ({
    page,
  }) => {
    await addFromDetail(page, SUERO_NATURAL.slug, 1);

    await page.goto("/productos");
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto(`/tienda/${HAZLO_SANO.handle}`);
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });

  test("Entonces cambiar la cantidad y quitar un renglón recalculan el total", async ({
    page,
  }) => {
    await addFromDetail(page, SUERO_NATURAL.slug, 1);
    await addFromDetail(page, seeded.slug, 2);

    await page.goto("/carrito");
    expect(await cartTotal(page)).toContain("75");

    // Dos sueros (70) + el sembrado (40).
    await page
      .getByTestId("cart-line")
      .filter({ hasText: SUERO_NATURAL.title })
      .getByRole("combobox")
      .selectOption("2");
    await expect(page.getByTestId("cart-group-total")).toContainText("110");

    await page
      .getByTestId("cart-line")
      .filter({ hasText: SUERO_NATURAL.title })
      .getByTestId("cart-remove")
      .click();

    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("cart-group-total")).toContainText("40");
  });

  /* El escenario "confirmar abre WhatsApp con el desglose" vivía aquí y se movió a
     `placeOrder.spec.ts`: desde el slice 2, confirmar registra el pedido y el aviso se manda desde
     su propia página. Aquí no se puede probar porque este archivo no inicia sesión — y confirmar sin
     sesión lleva a identificarse, que es justo lo que comprueba el otro archivo. */

  test("Entonces el carrito sobrevive a recargar la página", async ({
    page,
  }) => {
    await addFromDetail(page, SUERO_NATURAL.slug, 1);

    await page.goto("/carrito");
    await page.reload();

    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("cart-line")).toContainText(
      SUERO_NATURAL.title,
    );
  });
});

test.describe("Cuando un producto del carrito se agota", () => {
  /* Se siembra uno propio en vez de agotar uno de los 13 reales: marcar agotado un producto que se
     vende de verdad lo saca del sitio y de las recomendaciones del bot mientras corre la suite, y un
     fallo a media prueba lo dejaría así. */
  const perecedero = {
    title: `E2E Pan del día ${Date.now()}`,
    slug: testSlug("pan-del-dia"),
    kind: "producto" as const,
    origin: null,
    price: 50,
    sellerHandle: HAZLO_SANO.handle,
  };

  test.beforeEach(async () => {
    await seedPost(perecedero);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(perecedero.slug);
  });

  test("Entonces se ve marcado, no se cobra y no se le pide al vendedor", async ({
    page,
  }) => {
    await addFromDetail(page, SUERO_NATURAL.slug, 1);
    await addFromDetail(page, perecedero.slug, 2);

    await page.goto("/carrito");
    expect(await cartTotal(page)).toContain("85");

    await db.execute(sql`
      UPDATE posts SET is_available = false
      WHERE id IN (
        SELECT post_id FROM post_translations WHERE slug = ${perecedero.slug}
      )
    `);

    await page.goto("/carrito");

    // Sigue a la vista: quien lo puso ahí tiene derecho a enterarse.
    await expect(page.getByTestId("cart-line")).toHaveCount(2);
    await expect(page.getByTestId("cart-line-sold-out")).toHaveCount(1);
    // Y ya no suma: quedan solo los 35 del suero.
    expect(await cartTotal(page)).toContain("35");

    /* Que lo agotado tampoco entre en el pedido lo prueban el caso de uso (`placeOrderUseCase`, que
       lo deja fuera de los renglones) y el mensaje del aviso. Aquí se comprueba lo que es del
       carrito: que se ve, que no se cobra y que no desaparece a escondidas. */
  });
});

test.describe("Cuando el carrito está vacío", () => {
  test("Entonces lo dice y enlaza al catálogo", async ({ page }) => {
    await page.goto("/carrito");

    await expect(page.getByTestId("cart-empty")).toBeVisible();
    await expect(page.getByTestId("cart-group")).toHaveCount(0);
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
  });
});
