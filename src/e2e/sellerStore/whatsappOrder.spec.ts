import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

// Slice 2 de docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md.
// Los dos primeros escenarios corren contra datos REALES del catálogo: "Jugo Verde" existe con
// su WhatsApp desde la migración, y no hace falta sembrar nada para probar que el botón sale.
const JUGO_VERDE = {
  slug: "jugo-verde",
  title: "Jugo Verde",
  price: 40,
  whatsapp: "522781126948",
};

const HAZLO_SANO = { handle: "hazlo-sano", whatsapp: "522781126948" };

test.describe("Cuando el comprador quiere pedir un producto", () => {
  test("Entonces WhatsApp se abre con el producto, su precio y su enlace", async ({
    page,
  }) => {
    await page.goto(`/${JUGO_VERDE.slug}`);

    const href = await page.getByTestId("whatsapp-order").getAttribute("href");

    expect(href).toContain(`wa.me/${JUGO_VERDE.whatsapp}`);

    // El mensaje viaja codificado; se compara ya decodificado para leer lo que llega del
    // otro lado, que es lo que importa.
    const message = decodeURIComponent(
      new URL(href ?? "").searchParams.get("text") ?? "",
    );

    expect(message).toContain(JUGO_VERDE.title);
    expect(message).toContain(`$${JUGO_VERDE.price}`);
    expect(message).toContain(`/${JUGO_VERDE.slug}`);
  });

  test("Entonces desde la tienda se le puede escribir sin elegir producto", async ({
    page,
  }) => {
    await page.goto(`/tienda/${HAZLO_SANO.handle}`);

    const href = await page.getByTestId("whatsapp-store").getAttribute("href");

    expect(href).toContain(`wa.me/${HAZLO_SANO.whatsapp}`);

    const message = decodeURIComponent(
      new URL(href ?? "").searchParams.get("text") ?? "",
    );

    expect(message).toContain("Hazlo Sano");
    expect(message).toContain(`/tienda/${HAZLO_SANO.handle}`);
  });
});

test.describe("Cuando la publicación no se vende", () => {
  const anuncio = {
    title: `E2E Aviso de la comunidad ${Date.now()}`,
    slug: testSlug("aviso-de-la-comunidad"),
    kind: "anuncio" as const,
    origin: null,
  };

  test.beforeEach(async () => {
    await seedPost(anuncio);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(anuncio.slug);
  });

  test("Entonces un anuncio no ofrece el botón de pedir", async ({ page }) => {
    await page.goto(`/${anuncio.slug}`);

    await expect(
      page.getByRole("heading", { name: anuncio.title }),
    ).toBeVisible();
    await expect(page.getByTestId("whatsapp-order")).toHaveCount(0);
  });
});
