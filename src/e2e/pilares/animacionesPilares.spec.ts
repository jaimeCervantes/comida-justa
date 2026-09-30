import { expect, test } from "@playwright/test";
import { PILLARS } from "~/app/[locale]/pilares/components/pilaresData";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import { captionPlainText } from "~/presentation/habits/animations/captionMarkup";
import { PILLARS_OVERVIEW_SCRIPT } from "~/presentation/habits/animations/pillarsOverviewScript";
import { sceneStartMs } from "~/presentation/habits/animations/playhead";
import {
  goToAnimationScene as goToScene,
  markAnimationAsSeen,
  openPlayingAnimation,
  openWithAnimation,
  animationPlayer as player,
  soundButton,
  soundtrack,
  turnSoundOn,
} from "../testUtils/animationPlayer";
import { recordAnalytics, recordedEvents } from "../testUtils/recordAnalytics";

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

/**
 * Los tiempos salen del guion, no se copian: cambian cada vez que se vuelve a narrar un texto, y
 * una prueba con los milisegundos escritos a mano se rompería sin que nada estuviera mal.
 */
const [SLEEP_BEAT_1_MS, SLEEP_BEAT_2_MS] =
  PILLARS_OVERVIEW_SCRIPT[1].beatDurationsMs;
/** Hasta el tercer subtítulo de Sueño, con margen. */
const SLEEP_FIRST_TWO_BEATS_MS = SLEEP_BEAT_1_MS + SLEEP_BEAT_2_MS + 200;
/** Dónde empieza la escena de Sueño en la pista de sonido, en segundos. */
const SLEEP_START_S = sceneStartMs(PILLARS_OVERVIEW_SCRIPT, 1) / 1000;
const SOUNDTRACK_PATH = /\/animations\/pilares\/sonido-/;
const OVERVIEW_ID = "pillars-overview";

test.describe("La animación de los cuatro pilares en /pilares", () => {
  test("La primera visita la reproduce sola, debajo del héroe", async ({
    page,
  }) => {
    await openWithAnimation(page, "/pilares");

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
    await markAnimationAsSeen(page, OVERVIEW_ID);
    await openWithAnimation(page, "/pilares");
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
      await markAnimationAsSeen(page, OVERVIEW_ID);
      await openWithAnimation(page, "/pilares");

      await goToScene(page, scene);

      await expect(player(page)).toHaveAttribute("data-pillar", pillar);
    });
  }

  for (const { scene, visible } of [
    { scene: 1, visible: false },
    { scene: 3, visible: false },
    { scene: 6, visible: true },
  ]) {
    test(`El logo ${visible ? "se ve" : "no se ve"} en la escena ${scene}`, async ({
      page,
    }) => {
      await markAnimationAsSeen(page, OVERVIEW_ID);
      await openWithAnimation(page, "/pilares");

      await goToScene(page, scene);

      const logo = player(page).getByTestId("animation-logo");
      await (visible
        ? expect(logo).toBeVisible()
        : expect(logo).toHaveCount(0));
    });
  }

  test("Cada pilar se cuenta en tres tiempos", async ({ page }) => {
    await markAnimationAsSeen(page, OVERVIEW_ID);
    await openWithAnimation(page, "/pilares");
    await goToScene(page, 2);
    await player(page).getByTestId("animation-play-toggle").click();

    const caption = player(page).getByTestId("animation-caption");
    const seen: string[] = [];
    for (const [beat, ms] of [
      [1, 0],
      [2, SLEEP_BEAT_1_MS + 100],
      [3, SLEEP_BEAT_2_MS],
    ] as const) {
      await page.clock.fastForward(ms);
      await expect(player(page)).toHaveAttribute("data-beat", String(beat));
      await expect(player(page)).toHaveAttribute("data-scene", "2");
      seen.push((await caption.innerText()).trim());
    }

    expect(new Set(seen).size).toBe(3);
  });

  test("Se puede pausar y retomar donde iba", async ({ page }) => {
    await markAnimationAsSeen(page, OVERVIEW_ID);
    await openWithAnimation(page, "/pilares");
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
    await markAnimationAsSeen(page, OVERVIEW_ID);
    await openWithAnimation(page, "/pilares");
    await goToScene(page, 6);

    await player(page).getByTestId("animation-cta").click();

    await expect(page).toHaveURL(/\/pilares#practicas$/);
    await expect(page.locator("#practicas")).toBeInViewport();
  });

  test.describe("Con movimiento reducido", () => {
    test("no arranca sola y se lee como pasos", async ({ page }) => {
      /* Antes de cargar: la preferencia se lee al hidratar y decide si arranca. */
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openWithAnimation(page, "/pilares");
      await page.clock.fastForward(5000);

      await expect(player(page)).toHaveAttribute("data-mode", "steps");
      await expect(player(page)).not.toHaveAttribute("data-state", "playing");

      const caption = player(page).getByTestId("animation-caption");
      for (let scene = 1; scene <= 6; scene++) {
        await goToScene(page, scene);
        await expect(caption).not.toHaveText("");
      }
    });

    test("no hay sonido: la narración va al ritmo de la animación, y los pasos no lo tienen", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openWithAnimation(page, "/pilares");

      await expect(player(page)).toHaveAttribute("data-mode", "steps");
      await expect(soundButton(page)).toHaveCount(0);
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
      await markAnimationAsSeen(page, OVERVIEW_ID);
      await openWithAnimation(page, path);
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
 * El sonido (slice 8). El reloj falso de `page.clock` mueve la animación, pero el audio corre con
 * el reloj real del navegador: por eso aquí se comprueba adónde salta la pista y si suena o calla,
 * y no la sincronía fina, que la corrige el reproductor en cada cuadro.
 */
test.describe("El sonido de la animación", () => {
  test("nunca arranca solo, ni se descarga sin pedirlo", async ({ page }) => {
    const downloads: string[] = [];
    page.on("request", (request) => {
      if (SOUNDTRACK_PATH.test(request.url())) downloads.push(request.url());
    });
    await openPlayingAnimation(page, "/pilares");
    await page.clock.fastForward(3000);

    await expect(soundButton(page)).toHaveAttribute("aria-pressed", "false");
    expect(await soundtrack(page)).toMatchObject({ paused: true });
    expect(downloads).toEqual([]);
  });

  for (const { path, track } of [
    { path: "/pilares", track: "/animations/pilares/sonido-es.mp3" },
    { path: "/en/pillars", track: "/animations/pilares/sonido-en.mp3" },
  ]) {
    test(`En ${path}, activarlo reproduce ${track}`, async ({ page }) => {
      await openPlayingAnimation(page, path);

      await turnSoundOn(page);

      expect((await soundtrack(page)).path).toBe(track);
      const { seconds } = await soundtrack(page);
      await expect
        .poll(async () => (await soundtrack(page)).seconds)
        .toBeGreaterThan(seconds + 0.5);
    });
  }

  test("va donde va la animación: salta con ella y calla en pausa", async ({
    page,
  }) => {
    await openPlayingAnimation(page, "/pilares");
    await turnSoundOn(page);

    await player(page).getByTestId("animation-next").click();
    await expect(player(page)).toHaveAttribute("data-scene", "2");

    await expect
      .poll(async () => (await soundtrack(page)).seconds)
      .toBeGreaterThanOrEqual(SLEEP_START_S);
    expect((await soundtrack(page)).seconds).toBeLessThan(SLEEP_START_S + 5);

    await player(page).getByTestId("animation-play-toggle").click();
    await expect(player(page)).toHaveAttribute("data-state", "paused");
    await expect.poll(() => soundtrack(page)).toMatchObject({ paused: true });
  });

  test("silenciar lo calla sin detener la animación, y las dos cosas quedan medidas", async ({
    page,
  }) => {
    await recordAnalytics(page);
    await openPlayingAnimation(page, "/pilares");
    await turnSoundOn(page);

    await soundButton(page).click();

    await expect(soundButton(page)).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => soundtrack(page)).toMatchObject({ paused: true });
    await expect(player(page)).toHaveAttribute("data-state", "playing");
    await expect
      .poll(() => recordedEvents(page, "animation_sound"))
      .toEqual([
        expect.objectContaining({ placement: "page", state: "on" }),
        expect.objectContaining({ placement: "page", state: "off" }),
      ]);
  });
});

/**
 * La frase con la que termina un subtítulo: la de la página del pilar, en su idioma. El catálogo
 * marca la frase clave con `<hl>`; lo que se lee en pantalla es el texto sin marcas.
 */
function lastSentence(markup: string): string {
  const sentences = captionPlainText(markup).split(/(?<=\.)\s+/);
  return sentences[sentences.length - 1];
}
