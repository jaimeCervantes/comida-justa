import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";

/**
 * Slice 3 de `docs/features/wellbeing/001-2026-08-05-ubicacion-fresca.md`.
 *
 * **Este archivo se quedó con lo que solo él prueba.** Recorría tres rutas afirmando que cada una
 * enseñaba el chip; desde el slice 1 de `docs/features/platform/007-2026-08-21-chrome-v2.md` el
 * control vive en el chrome, así que esa afirmación es de `src/e2e/chrome/nearbyBar.spec.ts`, que
 * la hace sobre ocho rutas y además exige que aparezca **una sola vez**. Duplicarla aquí era
 * mantener dos listas de rutas que se desincronizan solas — y es exactamente cómo el home se quedó
 * sin control sin que nada fallara: la tabla del `.feature` decía "/" y la lista del spec no.
 *
 * Lo que queda es el caso del formato de cookie anterior, que no es del chrome sino de cómo se lee
 * la ubicación guardada.
 */
const VISITOR = { latitude: 18.6005415256606, longitude: -96.6872065729976 };

test.describe("Cuando la cookie viene del formato anterior", () => {
  /*
   * Una cookie del formato anterior no trae fecha. El chip tiene que aparecer igual —es la salida
   * para corregirla, y quien la tiene es justo quien más la necesita— pero sin inventarse una
   * antigüedad que nadie sabe.
   */
  test("Entonces el chip aparece, pero no se inventa la antigüedad", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      {
        name: VISITOR_LOCATION_COOKIE,
        value: `${VISITOR.latitude},${VISITOR.longitude}`,
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto("/productos");

    const chip = page.getByTestId("location-chip");

    await expect(chip).toBeVisible();
    /* La antigüedad vive en el nombre accesible desde el slice 5 de `chrome.feature`; sin fecha en
       la cookie, ese nombre dice desde dónde se mide y calla desde cuándo. */
    await expect(chip).toHaveAccessibleName(es.distance.chipLabel);
  });
});
