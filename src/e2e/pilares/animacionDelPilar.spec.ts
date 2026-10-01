import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { MIND_SPIRIT_STORY } from "~/presentation/habits/animations/stories/mindSpiritStory";
import { MOVEMENT_STORY } from "~/presentation/habits/animations/stories/movementStory";
import { NUTRITION_STORY } from "~/presentation/habits/animations/stories/nutritionStory";
import { SLEEP_STORY } from "~/presentation/habits/animations/stories/sleepStory";
import { PILLAR_PRACTICE_ANCHOR } from "~/presentation/habits/pillarPageAnchors";
import {
  goToAnimationScene,
  markAnimationAsSeen,
  openPlayingAnimation,
  openWithAnimation,
  animationPlayer as player,
  soundtrack,
  turnSoundOn,
} from "../testUtils/animationPlayer";
import { recordAnalytics, recordedEvents } from "../testUtils/recordAnalytics";

/**
 * La animación propia de cada pilar (`animacionDelPilar.feature`). Hoy, la de Sueño (slice 3).
 *
 * El tiempo va con `page.clock`, como en la animación de los cuatro pilares. Las etiquetas de cada
 * escena salen del catálogo y no se copian: el desk check de la `.feature` dice qué tiempo del arco
 * es cada una.
 */
const SLEEP_PAGE = `/pilares/${SLEEP_STORY.slug}`;

test.describe("La animación de Sueño en /pilares/sueno", () => {
  test("La primera visita la reproduce sola, entre el héroe y la práctica", async ({
    page,
  }) => {
    await openWithAnimation(page, SLEEP_PAGE);

    const [heroBox, playerBox, practiceBox] = await Promise.all([
      page.getByTestId("pillar-hero-action").boundingBox(),
      player(page).boundingBox(),
      page.locator(`#${PILLAR_PRACTICE_ANCHOR}`).boundingBox(),
    ]);
    expect(playerBox?.y).toBeGreaterThan(heroBox?.y ?? Infinity);
    expect(playerBox?.y).toBeLessThan(practiceBox?.y ?? -Infinity);

    await expect(player(page)).toHaveAttribute("data-state", "playing");
    await expect(player(page)).toHaveAttribute("data-scene", "1");
    await expect(player(page)).toHaveAttribute(
      "data-total-scenes",
      String(SLEEP_STORY.script.length),
    );
  });

  test("Al volver no arranca sola, pero se puede ver otra vez desde la escena 1", async ({
    page,
  }) => {
    await markAnimationAsSeen(page, SLEEP_STORY.animationId);
    await openWithAnimation(page, SLEEP_PAGE);
    await page.clock.fastForward(3000);

    await expect(player(page)).toHaveAttribute("data-state", "paused");

    await player(page).getByTestId("animation-play-toggle").click();

    await expect(player(page)).toHaveAttribute("data-state", "playing");
    await expect(player(page)).toHaveAttribute("data-scene", "1");
  });

  SLEEP_STORY.script.forEach((scene, index) => {
    const chip = es.pillarAnimations.sleep[scene.id].chip;
    test(`La escena ${index + 1} es de Sueño y se titula «${chip}»`, async ({
      page,
    }) => {
      await markAnimationAsSeen(page, SLEEP_STORY.animationId);
      await openWithAnimation(page, SLEEP_PAGE);

      await goToAnimationScene(page, index + 1);

      await expect(player(page)).toHaveAttribute("data-pillar", "sleep");
      await expect(player(page).getByText(chip, { exact: true })).toBeVisible();
    });
  });

  test("El cierre lleva a la práctica de la misma página", async ({ page }) => {
    await markAnimationAsSeen(page, SLEEP_STORY.animationId);
    await openWithAnimation(page, SLEEP_PAGE);
    await goToAnimationScene(page, SLEEP_STORY.script.length);

    await player(page).getByTestId("animation-cta").click();

    await expect(page).toHaveURL(
      new RegExp(`/pilares/sueno#${PILLAR_PRACTICE_ANCHOR}$`),
    );
    await expect(page.locator(`#${PILLAR_PRACTICE_ANCHOR}`)).toBeInViewport();
  });

  for (const { path, track } of [
    { path: SLEEP_PAGE, track: "/animations/pilares/sonido-sueno-es.mp3" },
    {
      path: `/en/pillars/${SLEEP_STORY.slug}`,
      track: "/animations/pilares/sonido-sueno-en.mp3",
    },
  ]) {
    test(`En ${path}, activar el sonido reproduce ${track}`, async ({
      page,
    }) => {
      await openPlayingAnimation(page, path);

      await turnSoundOn(page);

      expect((await soundtrack(page)).path).toBe(track);
    });
  }

  test("Se mide aparte de la animación de los cuatro pilares", async ({
    page,
  }) => {
    await recordAnalytics(page);
    await openPlayingAnimation(page, SLEEP_PAGE);

    await expect
      .poll(() => recordedEvents(page, "animation_play"))
      .toEqual([
        expect.objectContaining({
          animation: SLEEP_STORY.animationId,
          placement: "page",
          trigger: "auto",
        }),
      ]);
  });
});

/**
 * Los otros tres pilares (slices 4–6) usan la plantilla de Sueño: aquí se comprueba lo que cambia
 * de un pilar a otro —que su página la monte, que arranque, adónde lleva y qué pista suena—; el
 * resto del reproductor ya lo cubren las pruebas de Sueño.
 */
for (const story of [NUTRITION_STORY, MOVEMENT_STORY, MIND_SPIRIT_STORY]) {
  const path = `/pilares/${story.slug}`;

  test.describe(`La animación de ${path}`, () => {
    test("la primera visita la reproduce sola, entre el héroe y la práctica", async ({
      page,
    }) => {
      await openWithAnimation(page, path);

      const [heroBox, playerBox, practiceBox] = await Promise.all([
        page.getByTestId("pillar-hero-action").boundingBox(),
        player(page).boundingBox(),
        page.locator(`#${PILLAR_PRACTICE_ANCHOR}`).boundingBox(),
      ]);
      expect(playerBox?.y).toBeGreaterThan(heroBox?.y ?? Infinity);
      expect(playerBox?.y).toBeLessThan(practiceBox?.y ?? -Infinity);
      await expect(player(page)).toHaveAttribute("data-state", "playing");
      await expect(player(page)).toHaveAttribute("data-pillar", story.pillar);
    });

    test("su cierre lleva a la práctica de la misma página", async ({
      page,
    }) => {
      await markAnimationAsSeen(page, story.animationId);
      await openWithAnimation(page, path);
      await goToAnimationScene(page, story.script.length);

      await player(page).getByTestId("animation-cta").click();

      await expect(page.locator(`#${PILLAR_PRACTICE_ANCHOR}`)).toBeInViewport();
    });

    test("activar el sonido reproduce su propia pista", async ({ page }) => {
      await openPlayingAnimation(page, path);

      await turnSoundOn(page);

      expect((await soundtrack(page)).path).toBe(
        `${story.soundtrackBase}-es.mp3`,
      );
    });
  });
}
