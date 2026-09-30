import { expect, type Page, test } from "@playwright/test";
import { PILLARS } from "~/app/[locale]/pilares/components/pilaresData";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import { captionPlainText } from "~/presentation/habits/animations/captionMarkup";
import { PILLAR_ANIMATION_SEEN_KEY_PREFIX } from "~/presentation/habits/animations/seenAnimations";

/**
 * La animación de los cuatro pilares en `/pilares` (`animacionesPilares.feature`, slice 1).
 *
 * El tiempo se controla con `page.clock`: esperar de verdad los ~100 s del guion haría la prueba
 * lenta e intermitente, y adelantar el reloj es exactamente lo que el reproductor tiene que
 * soportar (una pestaña que vuelve de segundo plano hace lo mismo).
 *
 * El estado se lee de los `data-*` del reproductor y no de las etiquetas de los botones: los
 * textos se afinan, lo que no cambia es en qué escena y en qué estado está.
 */

const OVERVIEW_SEEN_KEY = `${PILLAR_ANIMATION_SEEN_KEY_PREFIX}pillars-overview`;

/** Los milisegundos de los dos primeros subtítulos de Sueño, con margen. */
const SLEEP_FIRST_TWO_BEATS_MS = 6250 + 9000 + 200;

function player(page: Page) {
  return page.getByTestId("pillars-animation");
}

async function markOverviewAsSeen(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "1");
  }, OVERVIEW_SEEN_KEY);
}

async function openOverview(page: Page, path = "/pilares") {
  await page.clock.install();
  await page.goto(path);
  await player(page).scrollIntoViewIfNeeded();
}

async function goToScene(page: Page, scene: number) {
  const current = Number(await player(page).getAttribute("data-scene"));
  for (let step = current; step < scene; step++) {
    await player(page).getByTestId("animation-next").click();
  }
  await expect(player(page)).toHaveAttribute("data-scene", String(scene));
}

test.describe("La animación de los cuatro pilares en /pilares", () => {
  test("La primera visita la reproduce sola, debajo del héroe", async ({
    page,
  }) => {
    await openOverview(page);

    const heroAction = page.getByTestId("pillar-hero-action");
    const cards = page.locator("#practicas");
    const [heroBox, playerBox, cardsBox] = await Promise.all([
      heroAction.boundingBox(),
      player(page).boundingBox(),
      cards.boundingBox(),
    ]);
    expect(playerBox?.y).toBeGreaterThan(heroBox?.y ?? Infinity);
    expect(playerBox?.y).toBeLessThan(cardsBox?.y ?? -Infinity);

    await expect(player(page)).toHaveAttribute("data-state", "playing");
    await expect(player(page)).toHaveAttribute("data-scene", "1");
    await expect(player(page)).toHaveAttribute("data-total-scenes", "6");
  });

  test("Al volver no arranca sola, pero se puede ver otra vez desde la escena 1", async ({
    page,
  }) => {
    await markOverviewAsSeen(page);
    await openOverview(page);
    await page.clock.fastForward(3000);

    await expect(player(page)).toHaveAttribute("data-state", "paused");

    await player(page).getByTestId("animation-play-toggle").click();

    await expect(player(page)).toHaveAttribute("data-state", "playing");
    await expect(player(page)).toHaveAttribute("data-scene", "1");
  });

  const pillarByScene = [
    { scene: 1, pillar: "none" },
    ...PILLARS.map((pillar) => ({
      scene: pillar.number + 1,
      pillar: pillar.key,
    })),
    { scene: 6, pillar: "none" },
  ];

  for (const { scene, pillar } of pillarByScene) {
    test(`La escena ${scene} es del pilar «${pillar}»`, async ({ page }) => {
      await markOverviewAsSeen(page);
      await openOverview(page);

      await goToScene(page, scene);

      await expect(player(page)).toHaveAttribute("data-pillar", pillar);
    });
  }

  for (const { scene, visible } of [
    { scene: 1, visible: true },
    { scene: 3, visible: false },
    { scene: 6, visible: true },
  ]) {
    test(`El logo ${visible ? "se ve" : "no se ve"} en la escena ${scene}`, async ({
      page,
    }) => {
      await markOverviewAsSeen(page);
      await openOverview(page);

      await goToScene(page, scene);

      const logo = player(page).getByTestId("animation-logo");
      await (visible
        ? expect(logo).toBeVisible()
        : expect(logo).toHaveCount(0));
    });
  }

  test("Cada pilar se cuenta en tres tiempos", async ({ page }) => {
    await markOverviewAsSeen(page);
    await openOverview(page);
    await goToScene(page, 2);
    await player(page).getByTestId("animation-play-toggle").click();

    const caption = player(page).getByTestId("animation-caption");
    const seen: string[] = [];
    for (const [beat, ms] of [
      [1, 0],
      [2, 6250 + 100],
      [3, 9000],
    ] as const) {
      await page.clock.fastForward(ms);
      await expect(player(page)).toHaveAttribute("data-beat", String(beat));
      await expect(player(page)).toHaveAttribute("data-scene", "2");
      seen.push((await caption.innerText()).trim());
    }

    expect(new Set(seen).size).toBe(3);
  });

  test("Se puede pausar y retomar donde iba", async ({ page }) => {
    await markOverviewAsSeen(page);
    await openOverview(page);
    await goToScene(page, 2);
    const toggle = player(page).getByTestId("animation-play-toggle");
    await toggle.click();
    await expect(player(page)).toHaveAttribute("data-state", "playing");

    await toggle.click();
    await page.clock.fastForward(30_000);

    await expect(player(page)).toHaveAttribute("data-state", "paused");
    await expect(player(page)).toHaveAttribute("data-scene", "2");

    await toggle.click();

    await expect(player(page)).toHaveAttribute("data-state", "playing");
    await expect(player(page)).toHaveAttribute("data-scene", "2");
  });

  test("El cierre invita a elegir una práctica en la misma página", async ({
    page,
  }) => {
    await markOverviewAsSeen(page);
    await openOverview(page);
    await goToScene(page, 6);

    await player(page).getByTestId("animation-cta").click();

    await expect(page).toHaveURL(/\/pilares#practicas$/);
    await expect(page.locator("#practicas")).toBeInViewport();
  });

  test.describe("Con movimiento reducido", () => {
    test("no arranca sola y se lee como pasos", async ({ page }) => {
      /* Antes de cargar: la preferencia se lee al hidratar y decide si arranca. */
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openOverview(page);
      await page.clock.fastForward(5000);

      await expect(player(page)).toHaveAttribute("data-mode", "steps");
      await expect(player(page)).not.toHaveAttribute("data-state", "playing");

      const caption = player(page).getByTestId("animation-caption");
      for (let scene = 1; scene <= 6; scene++) {
        await goToScene(page, scene);
        await expect(caption).not.toHaveText("");
      }
    });
  });

  for (const { path, sentence } of [
    {
      path: "/pilares",
      sentence: lastSentence(es.pillarAnimations.overview.sleep.b3),
    },
    {
      path: "/en/pillars",
      sentence: lastSentence(en.pillarAnimations.overview.sleep.b3),
    },
  ]) {
    test(`En ${path}, el último subtítulo de Sueño va en su idioma`, async ({
      page,
    }) => {
      await markOverviewAsSeen(page);
      await openOverview(page, path);
      await goToScene(page, 2);
      await player(page).getByTestId("animation-play-toggle").click();

      await page.clock.fastForward(SLEEP_FIRST_TWO_BEATS_MS);

      await expect(player(page)).toHaveAttribute("data-beat", "3");
      await expect(player(page).getByTestId("animation-caption")).toContainText(
        sentence,
      );
    });
  }
});

/**
 * La frase con la que termina un subtítulo: la de la página del pilar, en su idioma. El catálogo
 * marca la frase clave con `<hl>`; lo que se lee en pantalla es el texto sin marcas.
 */
function lastSentence(markup: string): string {
  const sentences = captionPlainText(markup).split(/(?<=\.)\s+/);
  return sentences[sentences.length - 1];
}
