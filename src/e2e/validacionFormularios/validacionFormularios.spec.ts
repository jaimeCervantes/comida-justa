import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

const TITLE_ES = /título de la publicación/i;
const TITLE_EN = /publication title/i;

/** Sale del campo sin escribir nada: es el `blur` lo que lo marca como tocado. */
async function leaveEmpty(page: Page, label: RegExp): Promise<void> {
  const field = page.getByLabel(label);

  await field.click();
  await field.fill("");
  await page.keyboard.press("Tab");
}

test.describe("Al publicar, el formulario dice por qué", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  /**
   * Lo que se comprueba no es sólo que salgan los mensajes: es que la Server Action **no se
   * ejecuta**. Cada rechazo que atrapa el navegador es una llamada que no cuesta sesión, consulta
   * de taxonomía ni repintado.
   */
  test("Enviar vacío enfoca el primer campo y no molesta al servidor", async ({
    page,
  }) => {
    await page.goto("/publicar");

    const serverCalls: string[] = [];
    page.on("request", (request) => {
      // Una Server Action viaja como POST a la propia ruta, con la cabecera que la identifica.
      if (request.method() === "POST" && request.headers()["next-action"])
        serverCalls.push(request.url());
    });

    // Dentro del formulario: la cabecera tiene su propio botón "Publicar", que es un enlace.
    await page
      .getByRole("form")
      .getByRole("button", { name: /^publicar$/i })
      .click();

    await expect(page.getByText("El título es obligatorio.")).toBeVisible();
    await expect(page.getByText("El teléfono es obligatorio.")).toBeVisible();
    await expect(page.getByText("El contenido es obligatorio.")).toBeVisible();

    await expect(page.getByLabel(TITLE_ES)).toBeFocused();
    await expect(page.getByLabel(TITLE_ES)).toBeInViewport();
    expect(serverCalls).toHaveLength(0);
    expect(new URL(page.url()).pathname).toBe("/publicar");
  });

  /**
   * El teléfono es donde hoy se pierde la publicación: el navegador sólo sabía decir «coincide con
   * el formato solicitado», que no nombra el formato.
   */
  test("El teléfono explica su formato en vez de decir una vaguedad", async ({
    page,
  }) => {
    await page.goto("/publicar");

    const phone = page.getByLabel(/teléfono/i);
    await phone.fill("278-109-2116");
    await page.keyboard.press("Tab");

    await expect(
      page.getByText("Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116"),
    ).toBeVisible();

    await phone.fill("2781092116");

    await expect(page.getByText(/10 dígitos/)).toHaveCount(0);
  });
});

/**
 * La razón de ser del slice.
 *
 * El navegador de la suite pide `es-MX` (ver `playwright.config.ts`), así que la fila que lo
 * demuestra es la segunda: mismo navegador y misma sesión en dos rutas, y el mensaje cambia con la
 * **ruta**. El globito nativo hacía lo contrario.
 */
test.describe("El mensaje habla el idioma de la ruta", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("En /publicar contesta en español", async ({ page }) => {
    await page.goto("/publicar");
    await leaveEmpty(page, TITLE_ES);

    await expect(page.getByText("El título es obligatorio.")).toBeVisible();
  });

  test("En /en/publish contesta en inglés, con el mismo navegador", async ({
    page,
  }) => {
    await page.goto("/en/publish");
    await leaveEmpty(page, TITLE_EN);

    await expect(page.getByText("The title is required.")).toBeVisible();
  });
});

test.describe("Con un navegador en inglés", () => {
  let dbSession: DbSession | undefined;

  test.use({ locale: "en-US" });

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("En /en/publish sigue mandando la ruta", async ({ page }) => {
    await page.goto("/en/publish");
    await leaveEmpty(page, TITLE_EN);

    await expect(page.getByText("The title is required.")).toBeVisible();
  });
});

/**
 * Editar y publicar son la misma primitiva, y el sentido de que lo sean es justamente éste: no hay
 * dos comportamientos que mantener sincronizados a mano.
 */
test.describe("Al editar, el formulario valida igual", () => {
  let dbSession: DbSession | undefined;
  const seeded: string[] = [];

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Un título borrado dice lo mismo que al publicar", async ({ page }) => {
    const slug = testSlug("jugo-verde-validable");
    seeded.push(slug);

    await seedPost({
      title: "E2E Jugo Verde validable",
      slug,
      kind: "producto",
      origin: "reventa_cercana",
      price: 40,
      contactPhone: "2781092116",
    });

    await page.goto(`/editar/${slug}`);
    await leaveEmpty(page, TITLE_ES);

    await expect(page.getByText("El título es obligatorio.")).toBeVisible();
  });

  test("Un teléfono mal escrito explica su formato", async ({ page }) => {
    const slug = testSlug("jugo-verde-telefono");
    seeded.push(slug);

    await seedPost({
      title: "E2E Jugo Verde con teléfono",
      slug,
      kind: "producto",
      origin: "reventa_cercana",
      price: 40,
      contactPhone: "2781092116",
    });

    await page.goto(`/editar/${slug}`);

    await page.getByLabel(/teléfono/i).fill("278109211");
    await page.keyboard.press("Tab");

    await expect(
      page.getByText("Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116"),
    ).toBeVisible();
  });
});
