import { test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  coordinatesAtKm,
  type SeededStore,
  seedStore,
} from "../testUtils/seedStore";
import { testStore } from "../testUtils/testSlug";
import StorePage from "./StorePage";

/*
 * Slice 7 de `docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md`, `Scenario Outline` "A qué distancia queda la
 * tienda, y cuándo no se puede saber".
 *
 * Las tres filas de `Examples` son los tres casos de aquí. La cifra concreta —que 1483 m se dicen
 * "1.5 km"— la cubre `StoreDistance.test.tsx` en Vitest, que no necesita ni base ni navegador para
 * verificar un redondeo. Lo que solo se puede comprobar de extremo a extremo es que la distancia
 * **llegue** desde PostGIS hasta la pantalla, y eso es lo que se afirma aquí.
 */
const CON_SUCURSAL = testStore("Panadería La Luz");
const SIN_SUCURSAL = testStore("Abarrotes Sin Mapa");
const SUCURSAL_A_KM = 2;

type Caso = {
  nombre: string;
  tienda: SeededStore;
  comparteUbicacion: boolean;
  esperaDistancia: boolean;
};

const CASOS: Caso[] = [
  {
    nombre: "dice a qué distancia queda cuando comparto mi ubicación",
    tienda: CON_SUCURSAL,
    comparteUbicacion: true,
    esperaDistancia: true,
  },
  {
    nombre: "no dice ninguna distancia si no doy mi ubicación",
    tienda: CON_SUCURSAL,
    comparteUbicacion: false,
    esperaDistancia: false,
  },
  {
    nombre: "no dice ninguna distancia si la tienda no tiene sucursal situada",
    tienda: SIN_SUCURSAL,
    comparteUbicacion: true,
    esperaDistancia: false,
  },
];

test.describe("Cuando alguien abre la página de una tienda", () => {
  test.beforeAll(async () => {
    await seedStore(CON_SUCURSAL, SUCURSAL_A_KM);
    await seedStore(SIN_SUCURSAL, null);
  });

  test.afterAll(async () => {
    await deleteTestSellerByHandle(CON_SUCURSAL.handle);
    await deleteTestSellerByHandle(SIN_SUCURSAL.handle);
  });

  for (const caso of CASOS) {
    test(`Entonces ${caso.nombre}`, async ({ page, baseURL }) => {
      await page.context().clearCookies();

      if (caso.comparteUbicacion) {
        // En el ancla de la comunidad, así que la sucursal sembrada le queda a 2 km.
        const visitante = coordinatesAtKm(0);

        await page.context().addCookies([
          {
            name: VISITOR_LOCATION_COOKIE,
            value: `${visitante.latitude},${visitante.longitude}`,
            url: baseURL ?? "http://localhost:3000",
          },
        ]);
      }

      const tienda = new StorePage(page);

      await tienda.goto(caso.tienda.handle);
      // El nombre primero: sin un ancla que confirme que la página ya pintó, "no hay distancia" se
      // cumpliría también en una página en blanco y la prueba pasaría sin probar nada.
      await tienda.expectName(caso.tienda.name);

      if (caso.esperaDistancia) {
        await tienda.expectDistanceShown();
      } else {
        await tienda.expectNoDistance();
      }
    });
  }
});
