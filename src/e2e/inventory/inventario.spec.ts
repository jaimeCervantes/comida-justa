import { expect, test } from "@playwright/test";
import type { PostKind } from "~/domain/entities/post/kind";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";
import { PostInventory } from "./PostInventory";

/**
 * La tienda real, y **la cuenta que la posee**.
 *
 * No es la cuenta de la suite: `seedPost` publica siempre con la de la suite, así que sembrar
 * dentro de `hazlo-sano` produce justo lo que hace falta para probar la segunda vía de
 * autorización — una publicación de la tienda que la escribió otra mano.
 */
const STORE_HANDLE = "hazlo-sano";
const STORE_OWNER_EMAIL = "jaime.cervantes.ve@gmail.com";

/** Alguien con sesión que no publicó nada ni tiene tienda. */
const STRANGER_EMAIL = "danielsrodroguez@gmail.com";

test.describe("Inventario de existencias", () => {
  const sessions: DbSession[] = [];
  const seeded: string[] = [];

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }

    for (const session of sessions.splice(0)) {
      await deleteSession(session.sessionToken);
    }
  });

  /** Siembra una publicación dentro de `Hazlo Sano` y la apunta para el barrido. */
  async function seed(
    name: string,
    overrides: Partial<SeedPostInput> = {},
  ): Promise<string> {
    const slug = testSlug(name);
    seeded.push(slug);

    await seedPost({
      title: `E2E ${name}`,
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 40,
      sellerHandle: STORE_HANDLE,
      ...overrides,
    });

    return slug;
  }

  test("Pongo cuántas me quedan y el sitio lo dice", async ({
    page,
    browserName,
  }) => {
    sessions.push(await simulateLogin(page, browserName));
    const slug = await seed("dona-chocolate-keto");
    const ficha = new PostInventory(page, slug);

    await ficha.open();
    await ficha.save("3");

    await expect(ficha.remaining).toContainText("3");
    await expect(ficha.orderButton).toBeVisible();
  });

  test("Al llegar a cero se agota solo", async ({ page, browserName }) => {
    sessions.push(await simulateLogin(page, browserName));
    const slug = await seed("dona-chocolate-keto-agotable");
    await seedStock(slug, 3);
    const ficha = new PostInventory(page, slug);

    await ficha.open();
    await ficha.save("0");

    await expect(ficha.soldOutBadge).toBeVisible();
    await expect(ficha.remaining).toBeHidden();
    await expect(ficha.orderButton).toBeHidden();

    /* La corrida de escritorio del `.feature`: las dos columnas se movieron juntas. Es la garantía
       de que el chatbot, que sólo lee `is_available`, deja de recomendar lo que se acabó. */
    expect(await readPostRowBySlug(slug)).toMatchObject({
      stock_quantity: 0,
      is_available: false,
    });
  });

  test("Reponer lo vuelve a ofrecer", async ({ page, browserName }) => {
    sessions.push(await simulateLogin(page, browserName));
    const slug = await seed("dona-chocolate-keto-reponible");
    await seedStock(slug, 0);
    const ficha = new PostInventory(page, slug);

    await ficha.open();
    await ficha.save("12");

    await expect(ficha.remaining).toContainText("12");
    await expect(ficha.soldOutBadge).toBeHidden();
    await expect(ficha.orderButton).toBeVisible();

    expect(await readPostRowBySlug(slug)).toMatchObject({
      stock_quantity: 12,
      is_available: true,
    });
  });

  test("El dueño de la tienda administra lo que publicó otra persona", async ({
    page,
    browserName,
  }) => {
    const slug = await seed("suero-natural-de-la-tienda");

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    const ficha = new PostInventory(page, slug);
    await ficha.open();
    await ficha.save("5");

    await expect(ficha.remaining).toContainText("5");
  });

  /* Que el servidor rechace además una petición forjada lo prueba el caso de uso
     (`setPostStockUseCase.test.ts`), que es donde vive la regla. Aquí se afirma lo que la persona
     observa: no se le ofrece, y la publicación sigue sin inventario. */
  test("Quien no es dueño de nada no puede tocarlo", async ({
    page,
    browserName,
  }) => {
    const slug = await seed("suero-natural-ajeno");

    sessions.push(
      await simulateLogin(page, browserName, { email: STRANGER_EMAIL }),
    );

    const ficha = new PostInventory(page, slug);
    await ficha.open();

    await expect(ficha.control).toBeHidden();
    expect(await readPostRowBySlug(slug)).toMatchObject({
      stock_quantity: null,
    });
  });

  const KIND_CASES: Array<{
    kind: PostKind;
    offered: boolean;
    seed: Partial<SeedPostInput>;
  }> = [
    { kind: "producto", offered: true, seed: {} },
    {
      kind: "servicio",
      offered: false,
      seed: { origin: null, durationMinutes: 45 },
    },
    {
      kind: "evento",
      offered: false,
      seed: {
        origin: null,
        price: null,
        startsAt: new Date("2027-09-05T00:30:00Z"),
      },
    },
    { kind: "anuncio", offered: false, seed: { origin: null, price: null } },
  ];

  for (const { kind, offered, seed: overrides } of KIND_CASES) {
    test(`El campo de existencias ${offered ? "se ve" : "no se ve"} en un ${kind}`, async ({
      page,
      browserName,
    }) => {
      sessions.push(await simulateLogin(page, browserName));
      const slug = await seed(`inventario-${kind}`, { kind, ...overrides });

      const ficha = new PostInventory(page, slug);
      await ficha.open();

      await expect(ficha.control).toBeVisible({ visible: offered });
    });
  }

  test("Solo un entero no negativo llega a la base", async ({
    page,
    browserName,
  }) => {
    sessions.push(await simulateLogin(page, browserName));
    const slug = await seed("dona-chocolate-keto-validada");
    await seedStock(slug, 3);
    const ficha = new PostInventory(page, slug);

    await ficha.open();

    /* Sólo lo que una persona puede llegar a escribir. Un `abc` no entra en un campo numérico —el
       navegador ni lo acepta—, así que la regla se prueba donde vive: `setPostStockUseCase.test.ts`. */
    for (const rechazado of ["-1", "2.5"]) {
      await ficha.save(rechazado);

      /* Que el campo quede marcado como inválido es la promesa; qué frase lo dice es cosa del
         catálogo, y el catálogo se reescribe sin que esto deje de ser verdad. */
      await expect(ficha.input).toHaveAttribute("aria-invalid", "true");
      expect(await readPostRowBySlug(slug)).toMatchObject({
        stock_quantity: 3,
      });
    }
  });

  test("Lo que no lleva inventario se comporta como siempre", async ({
    page,
    browserName,
  }) => {
    sessions.push(await simulateLogin(page, browserName));
    const slug = await seed("jugo-verde-sin-inventario");
    const ficha = new PostInventory(page, slug);

    await ficha.open();

    await expect(ficha.remaining).toBeHidden();
    await expect(ficha.input).toHaveValue("");
    await expect(ficha.manualSoldOutButton).toBeVisible();
  });
});
