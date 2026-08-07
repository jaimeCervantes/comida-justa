import type { FullConfig } from "@playwright/test";
import {
  describeTestData,
  hasTestData,
  sweepTestData,
} from "./testUtils/testData";
import { warmRoutes } from "./testUtils/warmRoutes";

/**
 * Una corrida no hereda la basura de otra.
 *
 * `afterEach` no se ejecuta si el proceso muere, y eso ya dejó tres publicaciones en la base que
 * comparten tres repositorios: el golden de recomendaciones del backend empezó a fallar por datos
 * que no eran suyos. Este barrido corre **antes del primer escenario**, así que una corrida caída
 * deja de contaminar la siguiente.
 *
 * **Límite conocido:** Playwright arranca el `webServer` *antes* que este gancho, así que si un
 * residuo impidiera que la aplicación levantara, el barrido no llegaría a correr. No ocurre con lo
 * que la suite siembra —`seedPost` siempre incluye media, y una publicación sin ella rompe el
 * render—, pero conviene saberlo: si la app no arranca, esto hay que barrerlo a mano.
 *
 * Ese mismo orden es lo que deja calentar las rutas aquí: cuando esto corre, el servidor ya está en
 * pie. Ver `testUtils/warmRoutes.ts`.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const removed = await sweepTestData();

  if (hasTestData(removed)) {
    console.warn(
      `[e2e] se barrieron ${describeTestData(removed)} de una corrida anterior. ` +
        "Si esto se repite, alguna corrida está muriendo antes de limpiar.",
    );
  }

  // El barrido primero: calentar es lento y no tiene sentido dejar la basura de otra corrida en la
  // base mientras tanto.
  const baseUrl = config.projects[0]?.use.baseURL;
  if (baseUrl) {
    await warmRoutes(baseUrl);
  }
}
