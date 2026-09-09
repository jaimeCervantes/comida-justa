import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Escenario en `src/e2e/entrar/desktopSignInLayout.feature`.
 *
 * El defecto reportado es geométrico: el header se salía del viewport y la ilustración de acceso
 * cubría el texto y los proveedores. Por eso la prueba mide relaciones de layout en navegador real
 * en vez de fijar pixeles o clases de Tailwind.
 */

type Box = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  return {
    top: box?.y ?? 0,
    right: (box?.x ?? 0) + (box?.width ?? 0),
    bottom: (box?.y ?? 0) + (box?.height ?? 0),
    left: box?.x ?? 0,
    width: box?.width ?? 0,
    height: box?.height ?? 0,
  };
}

function intersects(first: Box, second: Box): boolean {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

async function documentWidth(page: Page): Promise<{
  viewport: number;
  scroll: number;
}> {
  return page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
}

async function expectInsideViewport(
  page: Page,
  locator: Locator,
): Promise<void> {
  const [viewport, box] = await Promise.all([
    page.viewportSize(),
    boxOf(locator),
  ]);

  expect(viewport).not.toBeNull();
  expect(box.left).toBeGreaterThanOrEqual(0);
  expect(box.right).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
}

test.describe("Cuando una visita entra desde escritorio", () => {
  test.use({ viewport: { width: 1536, height: 900 } });

  test("Entonces el header y el acceso caben sin desbordar ni encimarse", async ({
    page,
  }) => {
    await page.goto("/auth/signin?callbackUrl=%2F");

    const header = page.getByRole("banner");
    const publishAction = header.getByRole("button", { name: "Publicar" });
    const signInAction = header.getByRole("button", {
      name: "Iniciar sesión",
    });
    const signInPanel = page.getByRole("main").getByRole("region", {
      name: "Opciones de inicio de sesión",
    });
    const artwork = signInPanel.getByTestId("signin-artwork");
    const intro = signInPanel.getByText(
      "Accede para publicar, comentar y participar en la comunidad. Elige un proveedor para iniciar sesión.",
    );
    const google = signInPanel.getByRole("button", {
      name: /sign in with google/i,
    });
    const microsoft = signInPanel.getByRole("button", {
      name: /sign in with microsoft/i,
    });
    const legal = signInPanel.getByText(
      "Al continuar aceptas nuestros términos y la política de privacidad.",
    );

    await expect(header).toBeVisible();
    await expect(publishAction).toBeVisible();
    await expect(signInAction).toBeVisible();
    await expect(publishAction).toHaveText("");
    await expect(signInAction).toHaveText("");
    await expect(signInPanel).toBeVisible();
    await expect(google).toBeVisible();
    await expect(microsoft).toBeVisible();
    await expect(legal).toBeVisible();

    expect(await documentWidth(page)).toEqual({
      viewport: 1536,
      scroll: 1536,
    });

    await expectInsideViewport(page, header);
    await expectInsideViewport(page, signInPanel);

    const [
      headerBox,
      panelBox,
      artworkBox,
      introBox,
      googleBox,
      microsoftBox,
      legalBox,
    ] = await Promise.all([
      boxOf(header),
      boxOf(signInPanel),
      boxOf(artwork),
      boxOf(intro),
      boxOf(google),
      boxOf(microsoft),
      boxOf(legal),
    ]);

    expect(panelBox.top).toBeGreaterThanOrEqual(headerBox.bottom);
    expect(intersects(artworkBox, introBox)).toBe(false);
    expect(intersects(artworkBox, googleBox)).toBe(false);
    expect(intersects(artworkBox, microsoftBox)).toBe(false);
    expect(googleBox.bottom).toBeLessThanOrEqual(microsoftBox.top);
    expect(microsoftBox.bottom).toBeLessThanOrEqual(legalBox.top);
  });
});
