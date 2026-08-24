import { expect, test } from "@playwright/test";
import { PILLARS } from "~/app/[locale]/pilares/components/pilaresData";

/**
 * El héroe de una página de pilar (5.6 del canvas).
 *
 * Se recorren los cuatro y no uno de muestra: el armazón es compartido, pero el número sale de
 * `PILLARS` y es lo único que cambia entre ellos — si alguien lo emparejara mal, un solo pilar de
 * muestra no lo vería.
 *
 * No se transcribe ninguna etiqueta. Lo que se afirma es que las dos salidas **llegan a algún
 * sitio**: un ancla rota no se queja, simplemente no lleva a ninguna parte, y ese es exactamente el
 * fallo que esta prueba tiene que ver.
 */
test.describe("El héroe de cada pilar", () => {
  for (const pillar of PILLARS) {
    test(`Dado /pilares/${pillar.slug}, ofrece empezar y ver lo que hay cerca`, async ({
      page,
    }) => {
      await page.goto(`/pilares/${pillar.slug}`);

      const acciones = page.getByTestId("pillar-hero-action");
      await expect(acciones).toBeVisible();

      const destinos = await acciones
        .getByRole("link")
        .evaluateAll((enlaces) =>
          enlaces.map((enlace) => enlace.getAttribute("href")),
        );
      expect(destinos.length).toBe(2);

      for (const destino of destinos) {
        expect(destino).toMatch(/^#/);
        await expect(page.locator(String(destino))).toBeVisible();
      }
    });

    test(`Dado /pilares/${pillar.slug}, su héroe dice qué número es`, async ({
      page,
    }) => {
      await page.goto(`/pilares/${pillar.slug}`);

      await expect(page.getByTestId("pillar-hero-number")).toHaveText(
        String(pillar.number),
      );
    });
  }

  test("Y la invitación habla de práctica, no de formar un hábito", async ({
    page,
  }) => {
    await page.goto(`/pilares/${PILLARS[0].slug}`);
    const acciones = page.getByTestId("pillar-hero-action");

    await expect(acciones).toContainText(/práctica/i);
    /* La página entera sí puede explicar que cinco repeticiones no prueban un hábito —lo hace, y a
       propósito—; lo que no puede es prometerlo en el botón con el que se entra. */
    await expect(acciones).not.toContainText(/hábito/i);
  });
});
