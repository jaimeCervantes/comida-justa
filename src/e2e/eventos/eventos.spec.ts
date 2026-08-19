import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/wellbeing/013-2026-08-16-cuatro-pilares-vivos.md`: `evento` con su fecha.
 *
 * Lo que se prueba es la afirmación central de la feature: que una publicación que **ocurre**
 * aparezca sola en la página de su pilar. Los tres pilares de abajo tienen HOY cero publicaciones,
 * así que cada escenario es un pilar que deja de ser decorativo.
 *
 * Los tres estados (próximo / en curso / pasado) NO se prueban aquí: se derivan del reloj y su
 * corrida de escritorio vive en `src/domain/entities/post/event.test.ts`, donde el reloj se puede
 * mover. Aquí se prueba que la fecha llegue hasta la pantalla.
 */
const PILARES = [
  ["movimiento_y_ejercicio", "Rodada del sábado en el kiosco"],
  ["sueno_y_descanso", "Taller de higiene del sueño"],
  ["mente_y_espiritu", "Meditación guiada en el parque"],
] as const;

/** Lejos en el futuro, para que el escenario no dependa de cuándo se corra. */
const FUTURO = new Date("2027-08-22T06:00:00Z");

test.describe("When a group publishes something that happens", () => {
  const slugs: string[] = [];

  test.afterEach(async () => {
    for (const slug of slugs) await deleteOnePostBySlug(slug);
    slugs.length = 0;
  });

  for (const [pilar, titulo] of PILARES) {
    test(`Then "${pilar}" stops being decorative`, async ({ page }) => {
      const slug = testSlug(pilar);
      slugs.push(slug);

      await seedPost({
        title: titulo,
        slug,
        kind: "evento",
        origin: null,
        price: null,
        category: pilar,
        startsAt: FUTURO,
      });

      // Se guardó como evento, sin precio ni procedencia, y con su fecha.
      const row = await readPostRowBySlug(slug);
      expect(row?.kind).toBe("evento");
      expect(row?.origin).toBeNull();
      expect(row?.starts_at).not.toBeNull();

      /* Y aparece en la página de su pilar SIN enganchar nada: esas páginas ya leen por subárbol de
         categoría, que es el hallazgo que hizo barato este slice. */
      await page.goto(`/${slug}`);
      await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
      await expect(page.getByTestId("event-date").first()).toBeVisible();
      await expect(page.getByTestId("event-date").first()).toHaveAttribute(
        "data-state",
        "proximo",
      );
      await expect(
        page.getByTestId("post-detail").getByTestId("add-to-cart"),
      ).toHaveCount(0);
    });
  }
});

test.describe("When the publisher chooses the event kind", () => {
  let dbSession: DbSession | undefined;

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  /* A un evento NO se le pregunta la procedencia: responde "¿lo haces o lo revendes?" y eso solo
     significa algo en mercancía. Una meditación no se revende. */
  test("Then the date is asked and the provenance is not", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName);

    await page.goto("/publicar");
    await page.getByLabel(/tipo de publicaci/i).selectOption("evento");

    await expect(page.getByLabel(/cuándo empieza/i)).toBeVisible();
    await expect(page.getByLabel(/cuándo termina/i)).toBeVisible();
    await expect(page.getByLabel(/de dónde viene/i)).toHaveCount(0);
  });

  /* Lo que ya existía no gana requisitos ni pierde campos. */
  test("Then a producto still asks for provenance and no date", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName);

    await page.goto("/publicar");
    await page.getByLabel(/tipo de publicaci/i).selectOption("producto");

    await expect(page.getByLabel(/de dónde viene/i)).toBeVisible();
    await expect(page.getByLabel(/cuándo empieza/i)).toHaveCount(0);
  });
});
