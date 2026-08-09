import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/**
 * El tamaño con el que el navegador **acaba** pintando un encabezado.
 *
 * Se mide computado y no por sus clases a propósito: el fallo que esto vigila no era una clase
 * equivocada sino el resultado de dos correctas —un `h1` sin peso y un `h2` en negrita del mismo
 * tamaño—, y eso solo se ve una vez resuelto el CSS.
 */
async function weightOf(
  page: Page,
  selector: string,
): Promise<{ size: number; weight: number }> {
  return page
    .locator(selector)
    .first()
    .evaluate((node) => {
      const style = window.getComputedStyle(node);

      return {
        size: Number.parseFloat(style.fontSize),
        weight: Number.parseInt(style.fontWeight, 10),
      };
    });
}

test.describe("Cuando una página tiene un título y secciones", () => {
  const post = {
    title: `E2E Miel con jerarquía ${Date.now()}`,
    slug: testSlug("miel-con-jerarquia"),
    kind: "producto" as const,
    origin: null,
    price: 120,
  };

  test.beforeEach(async ({ page }) => {
    await seedPost(post);
    await page.goto(`/${post.slug}`);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(post.slug);
  });

  /* "Publicaciones Relacionadas" se escribió a mano como `text-3xl font-bold`: mismo tamaño que el
     título de la publicación y con más peso, porque el `h1` iba sin `font-*`. El vecindario pesaba
     más que la publicación que se venía a leer. */
  test("Entonces ninguna sección pesa más que el título de la página", async ({
    page,
  }) => {
    const h1 = await weightOf(page, "h1");
    const related = await weightOf(page, "#related-heading");

    expect(h1.size).toBeGreaterThan(related.size);
    expect(h1.weight).toBeGreaterThanOrEqual(related.weight);
  });

  test("Entonces las secciones hermanas se ven iguales entre sí", async ({
    page,
  }) => {
    const related = await weightOf(page, "#related-heading");
    const comments = await weightOf(page, '[data-testid="comments"] h2');

    expect(comments).toEqual(related);
  });
});
