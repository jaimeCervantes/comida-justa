import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 5 de `docs/features/pedidos.md`: el carrito de **varias** tiendas, por fin en el navegador.
 *
 * Los cuatro slices anteriores lo construyeron sin poder verlo funcionar: la base tiene un solo
 * vendedor de verdad, así que `groupBySeller` siempre devolvía un grupo. Aquí se siembran dos tiendas
 * propias —ni Hazlo Sano ni la que crea `pnpm run seed:demo-seller`, que es para mirarlo a mano— y se
 * borran enteras antes y después de cada prueba, así que una corrida que muera a medias se limpia
 * sola en la siguiente.
 */
const PANADERIA = {
  name: "E2E Panadería Multitienda",
  handle: "e2e-panaderia-multi",
  phone: "2789990101",
};

const JUGUERIA = {
  name: "E2E Juguería Multitienda",
  handle: "e2e-jugueria-multi",
  phone: "2789990102",
};

/**
 * La cuenta que va a ser **dueña de la juguería**, distinta de la que compra.
 *
 * Hace falta una segunda persona para el escenario que importa de verdad aquí: que el vendedor NO
 * vea a qué otras tiendas le compró su cliente. Con una sola cuenta, comprador y vendedor serían la
 * misma y la comprobación no diría nada. Se crea y se borra con las tiendas.
 */
const DUENA_JUGUERIA = {
  id: "e2e-multitienda-owner",
  email: "pw.multitienda.owner@example.com",
  name: "E2E Dueña de la juguería",
};

const panDeCampo = {
  title: `E2E Pan de campo ${Date.now()}`,
  slug: testSlug("pan-de-campo-multi"),
  kind: "producto" as const,
  origin: null,
  price: 60,
  sellerHandle: PANADERIA.handle,
};

const bolillo = {
  title: `E2E Bolillo ${Date.now()}`,
  slug: testSlug("bolillo-multi"),
  kind: "producto" as const,
  origin: null,
  price: 25,
  sellerHandle: PANADERIA.handle,
};

const jugoVerde = {
  title: `E2E Jugo verde ${Date.now()}`,
  slug: testSlug("jugo-verde-multi"),
  kind: "producto" as const,
  origin: null,
  price: 40,
  sellerHandle: JUGUERIA.handle,
};

let dbSession: DbSession | undefined;

async function seedOwnerAccount(): Promise<void> {
  await db.execute(sql`
    INSERT INTO users (id, name, email, external_id)
    VALUES (${DUENA_JUGUERIA.id}, ${DUENA_JUGUERIA.name}, ${DUENA_JUGUERIA.email},
            ${DUENA_JUGUERIA.id})
    ON CONFLICT (id) DO NOTHING
  `);
}

/** Va DESPUÉS de borrar las tiendas: `sellers.user_id` apunta aquí. */
async function deleteOwnerAccount(): Promise<void> {
  await db.execute(
    sql`DELETE FROM sessions WHERE user_id = ${DUENA_JUGUERIA.id}`,
  );
  await db.execute(sql`DELETE FROM users WHERE id = ${DUENA_JUGUERIA.id}`);
}

async function attachJugueriaToOwner(): Promise<void> {
  await db.execute(sql`
    UPDATE sellers SET user_id = ${DUENA_JUGUERIA.id} WHERE slug = ${JUGUERIA.handle}
  `);
}

/** Los checkouts de los pedidos de las dos tiendas sembradas, en orden de creación. */
async function seededCheckoutIds(): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT o.checkout_id::text AS checkout_id
    FROM customer_orders o
    JOIN sellers s ON s.id = o.seller_id
    WHERE s.slug IN (${PANADERIA.handle}, ${JUGUERIA.handle})
    ORDER BY o.created_at
  `);

  return (result.rows as Array<{ checkout_id: string }>).map(
    (row) => row.checkout_id,
  );
}

/** Añade desde la ficha y espera **al número** del contador, que es lo que de verdad sincroniza. */
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

/** Confirma el grupo de esa tienda y espera a estar ya en la página del pedido. */
async function confirmStore(page: Page, storeName: string): Promise<void> {
  await page.goto("/carrito");
  await page
    .getByTestId("cart-group")
    .filter({ hasText: storeName })
    .getByTestId("cart-confirm")
    .click();
  await expect(page.getByTestId("order-detail")).toBeVisible();
}

test.beforeEach(async ({ page, browserName }) => {
  // Antes de sembrar: si una corrida anterior murió, aquí es donde se limpia su resto.
  await deleteTestSellerByHandle(PANADERIA.handle);
  await deleteTestSellerByHandle(JUGUERIA.handle);
  await deleteOwnerAccount();

  await seedOwnerAccount();
  await seedStore(PANADERIA, null);
  await seedStore(JUGUERIA, null);
  await attachJugueriaToOwner();
  await seedPost(panDeCampo);
  await seedPost(bolillo);
  await seedPost(jugoVerde);

  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  await deleteTestSellerByHandle(PANADERIA.handle);
  await deleteTestSellerByHandle(JUGUERIA.handle);
  await deleteOwnerAccount();

  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Cuando el carrito lleva productos de dos tiendas", () => {
  test("Entonces veo el subtotal de cada una y cuánto me voy a gastar en total", async ({
    page,
  }) => {
    await addFromDetail(page, panDeCampo.slug, 1);
    await addFromDetail(page, jugoVerde.slug, 2);

    await page.goto("/carrito");

    await expect(page.getByTestId("cart-group")).toHaveCount(2);

    const panaderia = page
      .getByTestId("cart-group")
      .filter({ hasText: PANADERIA.name });
    const jugueria = page
      .getByTestId("cart-group")
      .filter({ hasText: JUGUERIA.name });

    await expect(panaderia.getByTestId("cart-group-total")).toContainText("60");
    await expect(jugueria.getByTestId("cart-group-total")).toContainText("40");

    // Lo que sale del bolsillo, que es la pregunta que nadie contestaba.
    await expect(page.getByTestId("cart-grand-total")).toContainText("100");
    // Y se dice sin rodeos que no es un solo cobro.
    await expect(page.getByTestId("cart-summary")).toContainText("2");
  });

  test("Entonces con una sola tienda no se repite el total", async ({
    page,
  }) => {
    await addFromDetail(page, panDeCampo.slug, 1);
    await addFromDetail(page, bolillo.slug, 2);

    await page.goto("/carrito");

    await expect(page.getByTestId("cart-group")).toHaveCount(1);
    await expect(page.getByTestId("cart-group-total")).toContainText("85");
    // Su subtotal YA es el total: pintarlo otra vez haría dudar de si son dos cifras distintas.
    await expect(page.getByTestId("cart-summary")).toHaveCount(0);
  });
});

test.describe("Cuando confirmo las dos tiendas de un mismo carrito", () => {
  test("Entonces son una sola compra, con un solo checkout", async ({
    page,
  }) => {
    await addFromDetail(page, panDeCampo.slug, 1);
    await addFromDetail(page, jugoVerde.slug, 2);

    await confirmStore(page, PANADERIA.name);

    /* Con un solo pedido todavía no hay "compra de varias": lo que hay es la otra mitad esperando en
       el carrito, y se dice — si no, confirmarla depende de que uno se acuerde de volver. */
    await expect(page.getByTestId("checkout-orders")).toHaveCount(0);
    await expect(page.getByTestId("order-cart-pending")).toBeVisible();

    await confirmStore(page, JUGUERIA.name);

    const compra = page.getByTestId("checkout-orders");

    await expect(compra.getByTestId("checkout-order")).toHaveCount(2);
    await expect(compra).toContainText(PANADERIA.name);
    await expect(compra).toContainText(JUGUERIA.name);
    await expect(page.getByTestId("checkout-total")).toContainText("100");
    // Ya no queda nada por confirmar.
    await expect(page.getByTestId("order-cart-pending")).toHaveCount(0);

    // El que se está mirando se marca y no se enlaza a sí mismo.
    await expect(page.getByTestId("checkout-order-current")).toHaveCount(1);
    await expect(compra.getByTestId("checkout-order-link")).toHaveCount(1);

    // Y desde aquí se llega al otro, que cuenta la misma compra.
    await compra.getByTestId("checkout-order-link").click();
    await expect(page.getByTestId("order-detail")).toContainText(
      PANADERIA.name,
    );
    await expect(page.getByTestId("checkout-order")).toHaveCount(2);

    // La prueba de fondo: en la base es UN checkout, no dos.
    const checkouts = await seededCheckoutIds();

    expect(checkouts).toHaveLength(2);
    expect(new Set(checkouts).size).toBe(1);
  });

  /* Slice 7. Un solo botón para las dos tiendas no existe —`wa.me` abre UNA conversación y el
     mensaje de cada tienda lleva lo suyo—, así que lo que se comprueba es lo que sí se puede: que la
     compra entera se avise desde esta pantalla, sin ir y volver por la lista. */
  test("Entonces aviso a las dos tiendas desde una sola pantalla", async ({
    page,
  }) => {
    await addFromDetail(page, panDeCampo.slug, 1);
    await addFromDetail(page, jugoVerde.slug, 2);
    await confirmStore(page, PANADERIA.name);
    await confirmStore(page, JUGUERIA.name);

    // El pedido que se está mirando tiene el suyo arriba, en su propia tarjeta.
    const propio = page.getByTestId("order-notify");

    await expect(propio).toBeVisible();
    await expect(propio).toHaveAttribute(
      "href",
      new RegExp(`wa\\.me/52${JUGUERIA.phone}`),
    );

    const compra = page.getByTestId("checkout-orders");
    const hermano = compra.getByTestId("checkout-order-notify");

    /* Y en el bloque hay UNO solo: el de la panadería. El que se mira no lo repite —ya está arriba—,
       por el mismo motivo por el que tampoco se enlaza a sí mismo. */
    await expect(hermano).toHaveCount(1);
    await expect(hermano).toHaveAttribute(
      "href",
      new RegExp(`wa\\.me/52${PANADERIA.phone}`),
    );

    /* Cada mensaje lleva lo de SU tienda: el de la panadería no menciona el jugo. Es la misma regla
       que el `user_id` del `WHERE`: compartir el carrito no es compartir la clientela. */
    const mensaje = decodeURIComponent(
      (await hermano.getAttribute("href")) ?? "",
    );

    expect(mensaje).toContain(panDeCampo.title);
    expect(mensaje).not.toContain(jugoVerde.title);
    expect(mensaje).toContain("60");
  });

  test("Entonces el vendedor ve su pedido y no a quién más le compré", async ({
    page,
    browserName,
  }) => {
    await addFromDetail(page, panDeCampo.slug, 1);
    await addFromDetail(page, jugoVerde.slug, 2);
    await confirmStore(page, PANADERIA.name);
    await confirmStore(page, JUGUERIA.name);

    const pedidoDeLaJugueria = page.url();

    // Se entra como la dueña de la juguería, que no es quien compró.
    await page.context().clearCookies({ name: "authjs.session-token" });
    await simulateLogin(page, browserName, { email: DUENA_JUGUERIA.email });

    await page.goto(pedidoDeLaJugueria);

    await expect(page.getByTestId("order-detail")).toContainText(JUGUERIA.name);
    /* Compartir el carrito no es compartir la clientela: la consulta lleva el `user_id` del
       comprador, así que aquí no hay compra que enseñar. */
    await expect(page.getByTestId("checkout-orders")).toHaveCount(0);
    /* `body` y no `main`: la ficha del pedido pinta su propio `<main>` dentro del del layout, así
       que el localizador por etiqueta encuentra dos y falla por modo estricto. */
    await expect(page.locator("body")).not.toContainText(PANADERIA.name);
  });

  test("Entonces una compra nueva no se engancha a la anterior", async ({
    page,
  }) => {
    await addFromDetail(page, panDeCampo.slug, 1);
    await confirmStore(page, PANADERIA.name);

    // El carrito quedó vacío, así que la compra se cerró con él.
    await page.goto("/carrito");
    await expect(page.getByTestId("cart-empty")).toBeVisible();

    await addFromDetail(page, jugoVerde.slug, 1);
    await confirmStore(page, JUGUERIA.name);

    // Un pedido suelto no arrastra al de la semana pasada.
    await expect(page.getByTestId("checkout-orders")).toHaveCount(0);

    const checkouts = await seededCheckoutIds();

    expect(checkouts).toHaveLength(2);
    expect(new Set(checkouts).size).toBe(2);
  });
});
