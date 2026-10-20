import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/search/006-2026-10-17-palabras-a-medias.md`; los escenarios son los de
 * `palabrasAMedias.feature`.
 */

/** Los títulos de los resultados, en el orden en que salen. */
function resultTitles(page: Page) {
  return page.getByTestId("search-results").getByRole("heading");
}

/**
 * La regla del outline, sin fijar el producto: que alguna palabra del título empiece con cada
 * inicio. «Proteína de Soya» empieza con «prot» aunque mañana se publique otra proteína primero.
 */
function startsWords(title: string, starts: readonly string[]): boolean {
  const words = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/[^\p{L}\p{N}]+/u);

  return starts.every((start) => words.some((word) => word.startsWith(start)));
}

test.describe("Encuentro el producto aunque no termine de escribir la palabra", () => {
  for (const { escrito, inicios } of [
    { escrito: "prote", inicios: ["prot"] },
    { escrito: "galle", inicios: ["gall"] },
    { escrito: "barra de prot", inicios: ["barr", "prot"] },
  ]) {
    test(`«${escrito}»`, async ({ page }) => {
      await page.goto(`/buscar?q=${encodeURIComponent(escrito)}`);

      const first = resultTitles(page).first();
      await expect(first).toBeVisible();

      expect(startsWords(await first.innerText(), inicios)).toBe(true);
    });
  }
});

/**
 * Un token inventado y solo de letras, para que ninguna publicación real compita. Va con la marca
 * de la corrida: dos corridas no se pisan. Los números no sirven, porque el diccionario parte
 * «qorvanex123» de otra forma.
 */
const RUN = Date.now()
  .toString()
  .split("")
  .map((digit) => String.fromCharCode(97 + Number(digit)))
  .join("");
const TOKEN = `qorvanex${RUN}`;

test.describe("La palabra completa y su inicio", () => {
  const galletas = {
    title: `E2E Galletas de ${TOKEN}`,
    slug: testSlug("galletas-palabra-completa"),
  };
  const barra = {
    title: `E2E Barra ${TOKEN}trel`,
    slug: testSlug("barra-palabra-mas-larga"),
  };

  test.beforeAll(async () => {
    for (const post of [galletas, barra]) {
      await seedPost({
        ...post,
        kind: "producto",
        origin: "productor",
        price: 45,
      });
    }
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(galletas.slug);
    await deleteOnePostBySlug(barra.slug);
  });

  test("Una palabra completa no se abre a las que solo empiezan igual", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${TOKEN}`);

    await expect(resultTitles(page)).toHaveText([galletas.title]);
  });

  test("El inicio de la palabra encuentra las dos", async ({ page }) => {
    await page.goto(`/buscar?q=${TOKEN.slice(0, -3)}`);

    /* Cada una por su título y no la lista entera: el inicio también casa con lo que haya dejado
       otra corrida reciente, y eso no es lo que este escenario mira. */
    for (const { title } of [galletas, barra]) {
      await expect(resultTitles(page).filter({ hasText: title })).toHaveCount(
        1,
      );
    }
  });
});

/*
 * «Y esa búsqueda no queda registrada» lo cubre `SearchPostsUseCase.test.ts`: `searches` no lleva
 * marcador de corrida, y en la base compartida buscan «pan» personas de verdad.
 */
test("Un pilar sin ese producto no cuenta como búsqueda fallida", async ({
  page,
}) => {
  await page.goto("/buscar?q=pan");
  await expect(resultTitles(page).first()).toBeVisible();

  await page.getByTestId("facet-pillar-mindSpirit").click();
  await page.waitForURL("**pillar=mindSpirit**");

  await expect(page.getByTestId("search-empty")).toBeVisible();
  await expect(resultTitles(page)).toHaveCount(0);
});
