import type { Page } from "@playwright/test";

type RecordedEvent = [string, string, Record<string, string | number>];

declare global {
  interface Window {
    __gaEvents?: RecordedEvent[];
  }
}

/**
 * Sustituye `gtag` por un registro antes de cargar la página: se comprueba qué se envía, no que
 * Google lo reciba. (El sitio solo carga Google Analytics en producción; en las pruebas `gtag` no
 * existe hasta que este registro lo pone.)
 */
export async function recordAnalytics(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__gaEvents = [];
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
      ...args: unknown[]
    ) => {
      window.__gaEvents?.push(args as RecordedEvent);
    };
  });
}

/** Los parámetros de cada evento `name` registrado, en el orden en que se enviaron. */
export function recordedEvents(
  page: Page,
  name: string,
): Promise<Record<string, string | number>[]> {
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
