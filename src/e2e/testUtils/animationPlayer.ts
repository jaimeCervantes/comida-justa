import { expect, type Page } from "@playwright/test";
import { PILLAR_ANIMATION_SEEN_KEY_PREFIX } from "~/presentation/habits/animations/seenAnimations";

/**
 * Lo que las pruebas de las animaciones hacen con el reproductor, escrito una vez: lo usan la de
 * los cuatro pilares y la de cada pilar.
 *
 * El estado se lee de los `data-*` del reproductor y no de las etiquetas de los botones: los textos
 * se afinan, lo que no cambia es en qué escena y en qué estado está.
 */
export function animationPlayer(page: Page) {
  return page.getByTestId("pillars-animation");
}

/** Que este navegador ya vio la animación: al abrir, queda quieta en vez de arrancar sola. */
export async function markAnimationAsSeen(
  page: Page,
  animationId: string,
): Promise<void> {
  await page.addInitScript(
    (key) => window.localStorage.setItem(key, "1"),
    `${PILLAR_ANIMATION_SEEN_KEY_PREFIX}${animationId}`,
  );
}

/** Abre la página con el reloj de la prueba y deja el reproductor a la vista. */
export async function openWithAnimation(page: Page, path: string) {
  await page.clock.install();
  await page.goto(path);
  await animationPlayer(page).scrollIntoViewIfNeeded();
}

/**
 * Abre la página y espera a que la animación esté reproduciéndose sola, como en la primera visita.
 * Hay que esperarla antes de tocar nada: arranca cuando al menos la mitad del reproductor está a la
 * vista, y un clic en los controles de abajo desplaza la página y puede dejarlo por debajo.
 */
export async function openPlayingAnimation(page: Page, path: string) {
  await openWithAnimation(page, path);
  await expect(animationPlayer(page)).toHaveAttribute("data-state", "playing");
}

export async function goToAnimationScene(page: Page, scene: number) {
  const player = animationPlayer(page);
  const current = Number(await player.getAttribute("data-scene"));
  for (let step = current; step < scene; step++) {
    await player.getByTestId("animation-next").click();
  }
  await expect(player).toHaveAttribute("data-scene", String(scene));
}

export function soundButton(page: Page) {
  return animationPlayer(page).getByTestId("animation-sound");
}

/**
 * Lo que está haciendo el audio, leído del elemento y no del botón: el botón dice lo que se pidió;
 * el elemento, lo que el navegador está reproduciendo.
 */
export function soundtrack(page: Page) {
  return animationPlayer(page)
    .getByTestId("animation-soundtrack")
    .evaluate((audio: HTMLAudioElement) => ({
      paused: audio.paused,
      seconds: audio.currentTime,
      path: new URL(audio.currentSrc || audio.src).pathname,
    }));
}

export async function turnSoundOn(page: Page) {
  await soundButton(page).click();
  await expect(soundButton(page)).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => soundtrack(page)).toMatchObject({ paused: false });
}
