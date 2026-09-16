import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { openPublishStep } from "../testUtils/openPublishStep";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";
import { testPost } from "../testUtils/testSlug";

/**
 * El pie de `/publicar` promete que **publicar solo existe en el último paso** (ver el comentario
 * junto al `<footer>` de `PublishForm.tsx`): el botón de la derecha es "Continuar" en los dos
 * primeros pasos y "Publicar" —el único `type="submit"`— en el tercero.
 *
 * El bug: los dos viven en la misma posición del JSX sin nada que los distinga, así que React
 * reutiliza el mismo botón del DOM y solo le cambia el `type`. El navegador decide si un clic
 * dispara el envío mirando el `type` que el botón tiene **después** de que React ya reaccionó al
 * clic, no el que tenía cuando la persona lo tocó — así que "Continuar", al llegar al último paso,
 * puede convertirse en "Publicar" a mitad del propio clic y enviar el formulario sin que nadie lo
 * pidiera. La primera vez que se llega al paso 3 esto pasa inadvertido porque el teléfono y la
 * descripción siguen vacíos y el propio navegador cancela ese envío fantasma; pero si ya se llenó
 * el paso 3 una vez y la persona vuelve a un paso anterior y regresa, ese envío fantasma **ya pasa
 * la validación** y publica solo.
 */
const { title: productTitle, slug } = testPost(
  "No debe publicarse solo al volver",
);

test.describe("Dado alguien que ya llenó el paso 3 y vuelve a uno anterior", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    // Red de seguridad: si el bug reaparece, esto evita que una publicación fantasma sobreviva.
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Entonces volver a 'los detalles' y avanzar de nuevo no publica solo", async ({
    page,
  }) => {
    await stubStorageUpload(page);
    await page.goto("/publicar");

    await page
      .getByRole("textbox", { name: /t[ií]tulo de la publicación/i })
      .fill(productTitle);

    await openPublishStep(page, "phone");
    await page
      .getByRole("textbox", { name: /tel[eé]fono/i })
      .fill("2781092116");
    await page
      .getByRole("textbox", { name: /descripci[oó]n/i })
      .fill("Descripción de prueba para el escenario de envío fantasma.");
    await page
      .locator('form input[type="file"]')
      .setInputFiles("./src/e2e/dummies/post.jpg");
    await expect(page.getByText(/subido/i)).toBeVisible({ timeout: 45_000 });

    // Vuelve a "los detalles" y regresa a "cuándo y cómo te encuentran", como haría alguien que
    // quiere revisar algo antes de publicar.
    await page.getByTestId("publish-back").click();
    await expect(page.getByText(/paso 2 de 3/i)).toBeVisible();
    await page.getByTestId("publish-next").click();
    await expect(page.getByText(/paso 3 de 3/i)).toBeVisible();

    // El formulario no debió enviarse: seguimos en /publicar y "Publicar" sigue disponible.
    await expect(page).toHaveURL("/publicar");
    await expect(
      page.getByRole("form").first().getByRole("button", {
        name: "Publicar",
        exact: true,
      }),
    ).toBeEnabled();
  });
});
