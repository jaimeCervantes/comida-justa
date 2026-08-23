import { expect, test } from "@playwright/test";
import {
  OFFERED_KINDS,
  publishKindTestId,
} from "~/app/[locale]/publicar/publishKinds";
import { choosePublishKind } from "../testUtils/choosePublishKind";
import { openPublishStep } from "../testUtils/openPublishStep";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";

/**
 * El tipo de publicación, ahora en píldoras (5.3 del canvas).
 *
 * Lo que se afirma es **lo que promete el control**, no cómo está pintado: que se ven las cuatro
 * opciones sin desplegar nada, que elegir una cambia el formulario, que el teclado navega entre
 * ellas y que la elegida se distingue de las demás. Ni un color escrito a mano: la diferencia se
 * mide comparando la elegida con una que no lo está, que es lo que sigue siendo verdad cuando
 * cambie el token.
 */

const pill = (kind: string) => publishKindTestId(kind);

test.describe("Dado alguien que va a publicar", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/publicar");
  });

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Entonces ve los cuatro tipos sin desplegar nada", async ({ page }) => {
    for (const kind of OFFERED_KINDS) {
      await expect(page.getByTestId(pill(kind))).toBeVisible();
    }
  });

  test("Entonces elegir un tipo cambia qué campos le piden", async ({
    page,
  }) => {
    /* Un evento ocurre en un momento, así que —y solo entonces— se le pregunta cuándo. Es la
       promesa del control: la elección tiene consecuencias. */
    const startsAt = page.locator('input[name="startsAt"]');
    await expect(startsAt).toHaveCount(0);

    await choosePublishKind(page, "evento");

    /* La fecha vive en el segundo paso, así que hay que ir a verla: que exista en el árbol ya
       demuestra que la elección llegó, y verla demuestra que se puede rellenar. */
    await openPublishStep(page, "startsAt");
    await expect(startsAt).toBeVisible();
  });

  test("Entonces la elegida se distingue de las demás", async ({ page }) => {
    await choosePublishKind(page, "producto");

    const chosen = page.getByTestId(pill("producto"));
    const other = page.getByTestId(pill("evento"));

    await expect(chosen).toHaveAttribute("data-selected", "true");
    await expect(other).toHaveAttribute("data-selected", "false");

    /* Y se ve, no solo se declara: si `peer-checked` no llegara a compilar —una clase mal escrita
       en Tailwind v4 no falla, desaparece— las dos píldoras tendrían el mismo fondo y esto sería
       lo único que se daría cuenta. */
    const background = (locator: typeof chosen) =>
      locator
        .locator("span")
        .evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(await background(chosen)).not.toBe(await background(other));
  });

  test("Entonces el teclado navega entre las opciones", async ({ page }) => {
    /* Es lo que se gana usando radios de verdad en vez de botones con `aria-pressed`, y se afirma
       porque es justo lo que se perdería si alguien los cambiara por botones. */
    await page.getByTestId(pill("producto")).click();
    await page.keyboard.press("ArrowRight");

    await expect(page.getByTestId(pill("evento"))).toHaveAttribute(
      "data-selected",
      "true",
    );
  });
});
