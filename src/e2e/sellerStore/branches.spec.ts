import { expect, test } from "@playwright/test";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  chatbotFindsNearby,
  readBranchesByHandle,
} from "../testUtils/readBranches";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";
import BranchesPage from "./BranchesPage";
import SellerAccountPage from "./SellerAccountPage";

// Slice 3 de docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md.
// Las coordenadas son las de la sucursal real: Tezonapa, Veracruz.
const TEZONAPA = { latitude: 18.6005415, longitude: -96.6872066 };

const MAP_URL =
  "https://www.google.com/maps/place/Restaurante+Hazlo+Sano/@18.6,-96.68,17z/data=!4m6!3m5!8m2!3d18.6005415!4d-96.6872066";

const centro = {
  name: "Sucursal Centro",
  address: "Calle Melchor Ocampo #2, Col. Las Flores. Tezonapa, Veracruz",
  mapUrl: MAP_URL,
};

test.describe("Cuando un vendedor registra dónde está", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    // Borra sucursales, catálogo y tienda: los tres cuelgan del mismo `seller_id`.
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces su sucursal queda en el mapa y se ve en su tienda", async ({
    page,
  }) => {
    const branches = new BranchesPage(page);

    await branches.gotoAccount();
    await branches.addBranch(centro);
    await branches.expectListed(centro.name);

    await branches.gotoStore(store.handle);
    await branches.expectListed(centro.name);
    await expect(page.getByText(/dónde encontrarnos/i)).toBeVisible();

    // El punto no se ve en pantalla: se comprueba contra PostGIS, que es donde lo lee el chatbot.
    const saved = await readBranchesByHandle(store.handle);

    expect(saved).toHaveLength(1);
    expect(saved[0].latitude).toBeCloseTo(TEZONAPA.latitude, 5);
    expect(saved[0].longitude).toBeCloseTo(TEZONAPA.longitude, 5);
  });

  test("Entonces un enlace sin coordenadas se rechaza explicando qué copiar", async ({
    page,
  }) => {
    const branches = new BranchesPage(page);

    await branches.gotoAccount();
    await branches.addBranch({
      ...centro,
      mapUrl: "https://www.google.com/maps/place/Tezonapa",
    });

    await branches.expectError(/copia la dirección de la barra/i);
    expect(await readBranchesByHandle(store.handle)).toHaveLength(0);
  });

  test("Entonces puede tener más de una y ambas se listan", async ({
    page,
  }) => {
    const branches = new BranchesPage(page);

    await branches.gotoAccount();
    await branches.addBranch(centro);
    // Se espera a que la primera esté guardada: mientras la acción está en vuelo el botón queda
    // deshabilitado, así que un segundo envío inmediato se perdería.
    await branches.expectListed(centro.name);

    await branches.addBranch({
      ...centro,
      name: "Sucursal Mercado",
      address: "Mercado Municipal, Tezonapa, Veracruz",
    });
    await branches.expectListed("Sucursal Mercado");

    await branches.gotoStore(store.handle);

    await branches.expectListed("Sucursal Centro");
    await branches.expectListed("Sucursal Mercado");
    expect(await readBranchesByHandle(store.handle)).toHaveLength(2);
  });
});

/**
 * El radio geográfico vive en la función SQL que consume el chatbot, no en TypeScript. Se prueba
 * contra los datos REALES —la tienda "Hazlo Sano", su sucursal en Tezonapa y sus productos ya
 * indexados—, así que este escenario no siembra ni limpia nada.
 */
test.describe("Cuando el chatbot busca cerca de un cliente", () => {
  const INDEXED_PRODUCT_SLUG = "jugo-verde";
  const ONE_KM_NORTH = { latitude: 18.6095, longitude: -96.6872 };
  const XALAPA = { latitude: 19.5438, longitude: -96.9102 };
  const FIVE_KM = 5_000;

  test("Entonces recomienda al que tiene sucursal cerca y no al lejano", async () => {
    const nearby = await chatbotFindsNearby(
      INDEXED_PRODUCT_SLUG,
      ONE_KM_NORTH.latitude,
      ONE_KM_NORTH.longitude,
      FIVE_KM,
    );

    const faraway = await chatbotFindsNearby(
      INDEXED_PRODUCT_SLUG,
      XALAPA.latitude,
      XALAPA.longitude,
      FIVE_KM,
    );

    expect(nearby).toBe(true);
    expect(faraway).toBe(false);
  });
});
