import { expect, type Locator, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/platform/007-2026-08-21-chrome-v2.md`.
 *
 * El control para corregir la ubicación estaba escrito seis veces —una por página— y en la ruta de
 * entrada no estaba escrito ninguna: el commit `8b4d9bf` dejó de montar `HomeHero`, que era quien lo
 * llevaba en el home. Ninguna prueba lo vio porque `chip.spec.ts` recorría solo tres rutas.
 *
 * Ahora lo lleva el chrome (`NearbyBar`), así que la afirmación es la contraria y más fuerte: está
 * en **todas** las rutas, y en cada una **una sola vez**.
 */
const TIENDA = testStore("Panadería La Luz");
const SUCURSAL_KM = 2;
const VISITOR = coordinatesAtKm(SUCURSAL_KM - 0.35);

/** Dos horas: lo bastante viejo para que el chip tenga algo que decir sobre su antigüedad. */
const HACE_DOS_HORAS = Date.now() - 2 * 60 * 60 * 1000;

/**
 * Las que montaban el aviso a mano, las dos que nunca lo tuvieron, y `/` — la que lo perdió.
 * `/carrito` entra por ser la prueba de que esto es chrome y no una lista de rutas de catálogo.
 */
const RUTAS = [
  "/",
  "/productos",
  "/categoria/jugos",
  "/productores-locales",
  "/negocios-locales",
  "/pilares/alimentacion",
  "/buscar",
  "/carrito",
];

const cookieCon = (baseURL: string | undefined) => ({
  name: VISITOR_LOCATION_COOKIE,
  value: `${VISITOR.latitude},${VISITOR.longitude},${HACE_DOS_HORAS}`,
  url: baseURL ?? "http://localhost:3000",
});

/**
 * El centro vertical de un elemento, para afirmar que dos piezas comparten renglón.
 *
 * Se compara el **centro** y no la altura de la barra a propósito: un alto en píxeles congela el
 * relleno y el tamaño de fuente de hoy, y habría que reeditarlo cada vez que la barra respire
 * distinto. Dos centros que coinciden significan «están en la misma fila» pase lo que pase.
 */
async function centroVertical(locator: Locator): Promise<number> {
  const caja = await locator.boundingBox();

  if (!caja) throw new Error("El elemento no tiene caja: ¿está oculto?");

  return caja.y + caja.height / 2;
}

test.describe("Cuando el sitio ya sabe dónde está quien mira", () => {
  const slug = testSlug("pan-de-la-barra");

  test.beforeAll(async () => {
    await seedStore(TIENDA, SUCURSAL_KM);
    await seedPost({
      title: `E2E Pan de la barra ${Date.now()}`,
      slug,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: TIENDA.handle,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
    await deleteTestSellerByHandle(TIENDA.handle);
  });

  for (const ruta of RUTAS) {
    test(`Entonces "${ruta}" le deja corregir su ubicación`, async ({
      page,
      baseURL,
    }) => {
      await page.context().addCookies([cookieCon(baseURL)]);

      await page.goto(ruta);

      await expect(page.getByTestId("nearby-bar")).toBeVisible();
      await expect(page.getByTestId("location-chip")).toBeVisible();
      await expect(page.getByTestId("refresh-location")).toBeVisible();
      // Y no se le repite el aviso de que no sabemos dónde está, porque sí lo sabemos.
      await expect(page.getByTestId("location-notice")).toHaveCount(0);
    });
  }

  /*
   * El motivo por el que los seis avisos de página se retiraron en vez de convivir con la barra: en
   * `/productos` el mismo control habría aparecido dos veces en la misma pantalla.
   */
  test("Y el control aparece una sola vez, no una por sitio que lo montaba", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL)]);

    await page.goto("/productos");

    await expect(page.getByTestId("location-chip")).toHaveCount(1);
    await expect(page.getByTestId("refresh-location")).toHaveCount(1);
  });

  /*
   * La antigüedad es lo único que delata un dato que ya no es cierto. Desde el slice 5 no está
   * dibujada —medía ~170 px en el chrome de todas las rutas, y la barra tenía que caber en un
   * renglón— sino en el nombre accesible del bloque: quien usa lector de pantalla la oye y quien
   * usa ratón la lee al pasar por encima.
   */
  test("Y le dice desde cuándo es el dato que está usando", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL)]);

    await page.goto("/");

    await expect(page.getByTestId("location-chip")).toHaveAccessibleName(
      /hace 2 horas/i,
    );
  });
});

test.describe("Cuando no sabe dónde está", () => {
  test("Entonces el home hereda el aviso, no el chip", async ({ page }) => {
    await page.goto("/");

    const aviso = page.getByTestId("location-notice");

    await expect(aviso).toBeVisible();
    await expect(aviso.getByTestId("share-location")).toBeVisible();
    await expect(page.getByTestId("location-chip")).toHaveCount(0);
  });

  /*
   * `sellerCta` solo existe dentro de `LocationNotice`. Al retirar el aviso de las seis páginas,
   * si la barra no lo hubiera recogido habría desaparecido del sitio entero.
   */
  test("Y la invitación a abrir tienda viaja con él", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("seller-location-cta")).toBeVisible();
  });
});

/**
 * Slice 5: la barra cabe en un renglón.
 *
 * Los slices 1 y 4 le fueron dando piezas a la misma barra hasta que dejó de ser una fila. Como es
 * chrome, el alto que se comía se lo comía en **todas** las rutas.
 */
test.describe("En escritorio la barra es una sola fila", () => {
  test("Con ubicación: el control y los filtros comparten renglón", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL)]);

    await page.goto("/");

    const ubicacion = await centroVertical(page.getByTestId("location-chip"));
    const filtros = await centroVertical(
      page.getByTestId("publication-pillar-filter"),
    );

    expect(Math.abs(ubicacion - filtros)).toBeLessThanOrEqual(2);
  });

  test("Y sin ubicación también, que es la cara que más texto tenía", async ({
    page,
  }) => {
    await page.goto("/");

    const aviso = await centroVertical(page.getByTestId("location-notice"));
    const filtros = await centroVertical(
      page.getByTestId("publication-pillar-filter"),
    );

    expect(Math.abs(aviso - filtros)).toBeLessThanOrEqual(2);
  });

  /* Lo que cedió el sitio: la prosa. Ninguna de las acciones se fue con ella. */
  test("Porque dejó de explicar y se quedó con lo que se pulsa", async ({
    page,
  }) => {
    await page.goto("/");

    const barra = page.getByTestId("nearby-bar");

    await expect(barra).not.toContainText(es.distance.noticeIdle);
    await expect(barra.getByTestId("share-location")).toBeVisible();
    await expect(barra.getByTestId("seller-location-cta")).toBeVisible();
    await expect(barra.getByTestId("publication-pillar-filter")).toBeVisible();
  });
});

test.describe("En el teléfono la barra deja de ser un párrafo", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("Los cinco filtros son un renglón que se desliza", async ({ page }) => {
    await page.goto("/");

    const filtros = page.getByTestId("publication-pillar-filter");
    const primero = await centroVertical(filtros.getByRole("link").first());
    const ultimo = await centroVertical(filtros.getByRole("link").last());

    expect(Math.abs(primero - ultimo)).toBeLessThanOrEqual(2);
  });

  test("Y el último se alcanza deslizando, no está perdido", async ({
    page,
  }) => {
    await page.goto("/");

    const mente = page
      .getByTestId("publication-pillar-filter")
      .getByRole("link", { name: es.publicationPillars.mindSpirit });

    await mente.scrollIntoViewIfNeeded();

    await expect(mente).toBeInViewport();
  });

  /*
   * La medida en los términos del problema: la barra es chrome, así que lo que ocupe se lo quita al
   * catálogo en la primera pantalla de todas las rutas. Se afirma contra el alto de la ventana y no
   * contra un número de píxeles, que envejecería con el primer cambio de relleno.
   */
  test("Y no se come un quinto de la pantalla", async ({ page }) => {
    await page.goto("/");

    const caja = await page.getByTestId("nearby-bar").boundingBox();
    const ventana = page.viewportSize();

    expect(caja?.height ?? 0).toBeLessThan((ventana?.height ?? 780) / 5);
  });
});

test.describe("La búsqueda del header", () => {
  /*
   * Era "Buscar...". Es el único renglón del header que puede enseñar de qué va el catálogo, y los
   * ejemplos salen de publicaciones que existen de verdad en la base.
   */
  test("Dice qué buscar, con cosas que existen en el catálogo", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder(/suero natural/i).first()).toBeVisible();
  });
});
