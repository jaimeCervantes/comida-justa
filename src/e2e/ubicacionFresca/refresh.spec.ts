import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 2 de `docs/features/ubicacion-fresca.md`.
 *
 * La suite nunca había concedido el permiso del navegador: `distance.spec.ts` lo daba por
 * imposible ("lo concede el sistema operativo, no la página") y todos los escenarios inyectaban la
 * cookie a mano. Playwright **sí** puede concederlo, y hasta que no se hizo, el viaje completo
 * navegador → server action → cookie no se ejercitaba en ningún sitio.
 *
 * Aquí es imprescindible: lo que se prueba es justo que la ubicación llega **sin** que nadie
 * apriete nada, así que inyectar la cookie sería probar lo contrario.
 */
const TIENDA = testStore("Panadería La Luz");

/* La sucursal a 2 km del ancla; el visitante, encima de ella o a 40 km, según el escenario. */
const SUCURSAL_KM = 2;
const ENCIMA_DE_LA_TIENDA = coordinatesAtKm(SUCURSAL_KM);
const A_CUARENTA_KM = coordinatesAtKm(SUCURSAL_KM + 40);

test.describe("Cuando alguien ya le concedió el permiso de ubicación al sitio", () => {
  const slug = testSlug("pan-que-se-actualiza-solo");
  const title = `E2E Pan que se actualiza solo ${Date.now()}`;

  test.beforeAll(async () => {
    await seedStore(TIENDA, SUCURSAL_KM);
    await seedPost({
      title,
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

  test.use({ permissions: ["geolocation"] });

  test("Entonces ve distancias sin haber apretado nada", async ({
    page,
    context,
  }) => {
    await context.setGeolocation(ENCIMA_DE_LA_TIENDA);

    await page.goto(`/${slug}`);

    /* La primera carga llega sin cookie: la escribe el refrescador y `revalidatePath` repinta. */
    await expect(page.getByTestId("store-distance")).toContainText(/m|km/, {
      timeout: 20_000,
    });
    await expect(page.getByTestId("share-location")).toHaveCount(0);
  });

  test("Y al moverme a otro sitio, la distancia se corrige sola", async ({
    page,
    context,
  }) => {
    await context.setGeolocation(ENCIMA_DE_LA_TIENDA);
    await page.goto(`/${slug}`);
    await expect(page.getByTestId("store-distance")).toContainText(/m|km/, {
      timeout: 20_000,
    });

    // Me fui a 40 km: ni el navegador ni el sitio necesitan que yo se lo diga.
    await context.setGeolocation(A_CUARENTA_KM);
    await page.reload();

    /* Los 40 km son los del ayudante, que usa 111.32 km por grado; `ST_Distance` mide sobre el
       elipsoide y a esta latitud salen 39.8. Lo que el escenario afirma es que la distancia cambió
       sola de metros a decenas de kilómetros, no el segundo decimal. */
    await expect(page.getByTestId("store-distance")).toHaveText(/a 39\.\d km/, {
      timeout: 20_000,
    });
  });

  test("Y la cookie que escribe trae la fecha, no solo las coordenadas", async ({
    page,
    context,
  }) => {
    await context.setGeolocation(ENCIMA_DE_LA_TIENDA);
    await page.goto(`/${slug}`);
    await expect(page.getByTestId("store-distance")).toContainText(/m|km/, {
      timeout: 20_000,
    });

    const cookie = (await context.cookies()).find(
      (candidate) => candidate.name === VISITOR_LOCATION_COOKIE,
    );

    /* Next escribe la cookie percent-encoded (las comas salen como `%2C`) y la decodifica al
       leerla; aquí se mira el valor crudo, así que hay que deshacerlo primero. */
    const campos = decodeURIComponent(cookie?.value ?? "").split(",");

    expect(campos).toHaveLength(3);
    expect(Number(campos[2])).toBeGreaterThan(Date.now() - 60_000);
  });
});

test.describe("Cuando alguien NO le ha concedido el permiso al sitio", () => {
  const slug = testSlug("pan-sin-permiso");
  const title = `E2E Pan sin permiso ${Date.now()}`;
  const TIENDA_SIN_PERMISO = testStore("Panadería Sin Permiso");

  test.beforeAll(async () => {
    await seedStore(TIENDA_SIN_PERMISO, SUCURSAL_KM);
    await seedPost({
      title,
      slug,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: TIENDA_SIN_PERMISO.handle,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
    await deleteTestSellerByHandle(TIENDA_SIN_PERMISO.handle);
  });

  /*
   * Sin `grantPermissions`, Chromium deja el permiso en `prompt`. El sitio no debe preguntar nada:
   * abrir el diálogo sin que nadie lo pida es lo que lleva a la gente a bloquearlo para siempre.
   */
  test("Entonces no se le detecta nada y se le sigue ofreciendo compartirla", async ({
    page,
  }) => {
    await page.goto(`/${slug}`);

    await expect(page.getByTestId("share-location")).toBeVisible();
    await expect(page.getByTestId("store-distance")).toHaveCount(0);
  });
});
