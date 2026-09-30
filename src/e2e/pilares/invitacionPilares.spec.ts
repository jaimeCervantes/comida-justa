import { expect, type Page, test } from "@playwright/test";
import { INVITE_DELAY_MS } from "~/presentation/habits/animations/inviteRoutes";
import { PILLAR_ANIMATION_SEEN_KEY_PREFIX } from "~/presentation/habits/animations/seenAnimations";

/**
 * La invitación a ver los cuatro pilares y la medición (`invitacionPilares.feature`, slice 2).
 *
 * El resto de la suite arranca con la invitación ya descartada (ver `storageState` en
 * `playwright.config.ts`): una tarjeta que aparece a los pocos segundos podría tapar el botón que
 * otro escenario va a pulsar. Aquí se empieza de cero, como alguien que llega por primera vez.
 *
 * El tiempo va con `page.clock`: la invitación espera unos segundos antes de aparecer.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const OVERVIEW_SEEN_KEY = `${PILLAR_ANIMATION_SEEN_KEY_PREFIX}pillars-overview`;
/** La animación entera dura algo más de 100 s. */
const WHOLE_ANIMATION_MS = 101_000;

type RecordedEvent = [string, string, Record<string, string | number>];

declare global {
  interface Window {
    __gaEvents?: RecordedEvent[];
  }
}

/** Sustituye `gtag` por un registro: se comprueba qué se envía, no que Google lo reciba. */
async function recordAnalytics(page: Page) {
  await page.addInitScript(() => {
    window.__gaEvents = [];
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
      ...args: unknown[]
    ) => {
      window.__gaEvents?.push(args as RecordedEvent);
    };
  });
}

function recorded(page: Page, name: string) {
  return page.evaluate(
    (eventName) =>
      (window.__gaEvents ?? [])
        .filter(
          ([command, event]) => command === "event" && event === eventName,
        )
        .map(([, , params]) => params),
    name,
  );
}

/**
 * Abre la página y espera a que la invitación haya hidratado: su temporizador solo existe a partir
 * de ahí. Adelantar el reloj antes sería adelantarlo para nadie.
 */
async function open(page: Page, path: string) {
  await page.clock.install();
  await page.goto(path);
  await expect(page.getByTestId("pillars-invite-probe")).toBeAttached();
}

/**
 * Deja pasar el tiempo de la invitación a pasos, con respiros reales entre uno y otro: el efecto
 * que arma el temporizador corre justo después de hidratar, y un único salto podría adelantarse a
 * él.
 */
async function letInviteTimePass(page: Page) {
  const steps = Math.ceil(INVITE_DELAY_MS / 1000) + 2;
  for (let step = 0; step < steps; step++) {
    await page.clock.fastForward(1000);
    await page.waitForTimeout(100);
  }
}

function invite(page: Page) {
  return page.getByTestId("pillars-invite");
}

test.describe("La invitación de la primera visita", () => {
  for (const path of ["/", "/productos", "/pilares/sueno"]) {
    test(`En ${path}, la primera visita invita sin quitar el foco`, async ({
      page,
    }) => {
      await open(page, path);
      await letInviteTimePass(page);

      await expect(invite(page)).toBeVisible();
      await expect(
        page.locator('[data-testid="pillars-invite"] :focus'),
      ).toHaveCount(0);
    });
  }

  test("Al aceptarla, la animación se reproduce encima de la página, sin salir de ella", async ({
    page,
  }) => {
    await open(page, "/");
    await letInviteTimePass(page);
    await invite(page).getByTestId("pillars-invite-watch").click();

    const dialog = page.getByTestId("pillars-animation-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("pillars-animation")).toHaveAttribute(
      "data-state",
      "playing",
    );
    await expect(page).toHaveURL(/\/$/);

    await dialog.getByTestId("pillars-animation-dialog-close").click();

    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test("Cerrada una vez, no vuelve", async ({ page }) => {
    await open(page, "/");
    await letInviteTimePass(page);
    await invite(page).getByTestId("pillars-invite-later").click();
    await expect(invite(page)).toHaveCount(0);

    await page.goto("/productos");
    await expect(page.getByTestId("pillars-invite-probe")).toBeAttached();
    await letInviteTimePass(page);

    await expect(invite(page)).toHaveCount(0);
  });

  for (const path of ["/pilares", "/carrito"]) {
    test(`No aparece en ${path}`, async ({ page }) => {
      await open(page, path);
      await letInviteTimePass(page);

      await expect(invite(page)).toHaveCount(0);
    });
  }

  test("Quien ya vio la animación no recibe la invitación", async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "1");
    }, OVERVIEW_SEEN_KEY);
    await open(page, "/");
    await letInviteTimePass(page);

    await expect(invite(page)).toHaveCount(0);
  });
});

test.describe("La medición", () => {
  test.beforeEach(async ({ page }) => {
    await recordAnalytics(page);
  });

  test("La invitación registra que se mostró, y que se descartó", async ({
    page,
  }) => {
    await open(page, "/");
    await letInviteTimePass(page);
    await expect(invite(page)).toBeVisible();

    await expect
      .poll(() => recorded(page, "animation_invite_shown"))
      .toEqual([expect.objectContaining({ placement: "invite" })]);

    await invite(page).getByTestId("pillars-invite-later").click();

    await expect
      .poll(() => recorded(page, "animation_invite_dismiss"))
      .toEqual([expect.objectContaining({ placement: "invite" })]);
  });

  test("Aceptarla registra la aceptación y el arranque de la animación", async ({
    page,
  }) => {
    await open(page, "/");
    await letInviteTimePass(page);
    await invite(page).getByTestId("pillars-invite-watch").click();

    await expect
      .poll(() => recorded(page, "animation_invite_accept"))
      .toEqual([expect.objectContaining({ placement: "invite" })]);
    await expect
      .poll(() => recorded(page, "animation_play"))
      .toEqual([
        expect.objectContaining({ placement: "invite", trigger: "auto" }),
      ]);
  });

  test("En /pilares se registran las escenas alcanzadas, el final y la invitación a practicar", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/pilares");
    const player = page.getByTestId("pillars-animation");
    await player.scrollIntoViewIfNeeded();
    await expect(player).toHaveAttribute("data-state", "playing");

    await page.clock.fastForward(17_600);
    await expect(player).toHaveAttribute("data-scene", "2");
    await expect
      .poll(() => recorded(page, "animation_scene"))
      .toContainEqual(expect.objectContaining({ placement: "page", scene: 2 }));

    await page.clock.fastForward(WHOLE_ANIMATION_MS);
    await expect(player).toHaveAttribute("data-state", "finished");
    await expect
      .poll(() => recorded(page, "animation_complete"))
      .toEqual([expect.objectContaining({ placement: "page" })]);

    await player.getByTestId("animation-cta").click();
    await expect
      .poll(() => recorded(page, "animation_cta"))
      .toEqual([expect.objectContaining({ placement: "page" })]);
  });
});
