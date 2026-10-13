import type { Locator, Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/** Las migas de la página, por su nombre accesible: el mismo que usa el catálogo. */
export function breadcrumbs(page: Page): Locator {
  return page.getByRole("navigation", { name: es.common.breadcrumb });
}

/**
 * El camino como se lee: «Inicio / Difusión en grupos / …».
 *
 * Cada paso después del primero trae la barra que lo separa; se quita aquí para comparar contra la
 * misma frase que escribe el `.feature`, sin depender del espaciado de la pantalla.
 */
export async function readBreadcrumbs(page: Page): Promise<string> {
  const steps = await breadcrumbs(page).getByRole("listitem").allTextContents();

  return steps.map((step) => step.replace(/^\s*\/\s*/, "").trim()).join(" / ");
}

/** Un tramo de las migas que lleva a otra página. */
export function breadcrumbLink(page: Page, name: string): Locator {
  return breadcrumbs(page).getByRole("link", { name, exact: true });
}
