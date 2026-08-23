import { expect, test } from "@playwright/test";
import { publicationPillarNumber } from "~/domain/entities/post/publicationPillars";
import { openPublishStep } from "../testUtils/openPublishStep";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import PublishAsidePage from "./PublishAsidePage";
import PublishFieldsPage from "./PublishFieldsPage";

/**
 * La vista previa y el checklist de `/publicar`, en un navegador de verdad.
 *
 * **Este archivo existe por una razón concreta.** En el slice anterior se intentó marcar los pasos
 * con errores por tres mecanismos distintos; los tres funcionaban en jsdom y ninguno llegaba en
 * Chrome, y se descubrió tarde. La vista previa se apoya en otro mecanismo de eventos —oyentes
 * nativos de `input` y `change` en el contenedor de los pasos— y no se puede dar por bueno con
 * pruebas de componente. Lo que estos escenarios comprueban, antes que ningún detalle visual, es
 * que **el mecanismo llega**.
 *
 * La categoría se elige por su clave (`alimentacion`), que es un dato del dominio, y el rótulo se
 * lee del propio selector: así el escenario sobrevive a que alguien la renombre desde
 * `/admin/catalogo`, que es exactamente el tipo de edición que no debería costar una prueba.
 */

const PILLAR_CATEGORY = "alimentacion";

test.describe("Dado alguien que está escribiendo una publicación", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/publicar");
  });

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Entonces la tarjeta de al lado enseña lo que va escribiendo", async ({
    page,
  }) => {
    const aside = new PublishAsidePage(page);
    const fields = new PublishFieldsPage(page);
    const title = "Miel cruda de azahar · 500 g";

    await expect(aside.preview).toBeVisible();
    await fields.title.fill(title);

    await expect(aside.preview).toContainText(title);
  });

  test("Entonces el pilar elegido se ve en la tarjeta con su número", async ({
    page,
  }) => {
    const aside = new PublishAsidePage(page);
    const fields = new PublishFieldsPage(page);

    await fields.chooseCategory(PILLAR_CATEGORY);

    await expect(aside.preview).toContainText(
      await fields.categoryLabel(PILLAR_CATEGORY),
    );
    /* El número sale del dominio, no escrito a mano: es el mismo que pinta la tarjeta del listado,
       y existe porque Movimiento y Mente no se distinguen solo por el color. */
    await expect(aside.preview).toContainText(
      String(publicationPillarNumber("nutrition")),
    );
  });

  test("Entonces el checklist va tachando lo que ya llenó", async ({
    page,
  }) => {
    const aside = new PublishAsidePage(page);
    const fields = new PublishFieldsPage(page);

    await aside.expectDone("essentials", false);
    await aside.expectDone("pillar", false);

    await fields.title.fill("Miel cruda de azahar · 500 g");
    await fields.chooseCategory(PILLAR_CATEGORY);

    await aside.expectDone("essentials", true);
    await aside.expectDone("pillar", true);
    /* La foto queda pendiente a propósito: es lo único recomendado y no obligatorio, y es lo que
       permite que el resumen llegue a «ya puedes publicar» sin ella. */
    await aside.expectDone("media", false);
  });

  test("Entonces un punto pendiente lleva a su campo y lo enfoca", async ({
    page,
  }) => {
    const aside = new PublishAsidePage(page);
    const fields = new PublishFieldsPage(page);

    /* Se empieza lejos, en el primer paso, para que el salto tenga algo que demostrar. */
    await openPublishStep(page, "title");
    await expect(fields.phone).toBeHidden();

    await aside.goTo("contact");

    await expect(fields.phone).toBeVisible();
    await expect(fields.phone).toBeFocused();
  });

  test("Entonces el resumen cambia cuando ya no falta nada obligatorio", async ({
    page,
  }) => {
    const aside = new PublishAsidePage(page);
    const fields = new PublishFieldsPage(page);
    const pending = await aside.summary.innerText();

    await fields.fillEverythingRequired({
      title: "Taller de compostaje en el parque",
      category: PILLAR_CATEGORY,
      phone: "2781092116",
      content: "Nos vemos el sábado a las 10 en la entrada del parque.",
    });

    /* Sin foto, y aun así el resumen tiene que cambiar: lo recomendado no bloquea. */
    await aside.expectDone("media", false);
    await expect(aside.summary).not.toHaveText(pending);
  });
});
