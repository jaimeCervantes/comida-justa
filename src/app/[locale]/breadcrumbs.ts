import { categoryTrail, labelFor } from "~/domain/entities/post/taxonomy";
import type { BreadcrumbItem } from "~/domain/seo/jsonLd/breadcrumbs";
import { absoluteUrl } from "~/domain/seo/url";
import { getPathname } from "~/i18n/navigation";
import type { AppLocale } from "~/i18n/routing";
import { CANONICAL_URL } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import type { Crumb } from "~/presentation/navigation/Breadcrumbs";

/**
 * El camino de una página, en las dos formas que hacen falta a la vez: la que se pinta (con el
 * `href` tipado de next-intl) y la que se declara en JSON-LD (con la URL absoluta).
 *
 * Se arman juntas a propósito: son la misma lista, y Google pide que el `BreadcrumbList` refleje
 * lo que la página enseña. Calculadas por separado acabarían diciendo cosas distintas.
 *
 * Vive aquí, y no dentro de una ruta, porque lo usan dos: el catálogo de una categoría y el
 * detalle de una publicación.
 */
export interface Breadcrumbs {
  crumbs: Crumb[];
  jsonLdItems: BreadcrumbItem[];
}

/** `Inicio › Alimentación › Panadería`, siguiendo la jerarquía real de la taxonomía. */
export async function categoryBreadcrumbs(
  key: string,
  homeLabel: string,
  locale: AppLocale,
): Promise<Breadcrumbs> {
  const steps = await categorySteps(key, locale);
  const start = home(homeLabel);

  return {
    crumbs: [start.crumb, ...steps.crumbs],
    jsonLdItems: [start.item, ...steps.jsonLdItems],
  };
}

/**
 * `Inicio › Panadería › Pan de Masa Madre Natural`.
 *
 * El título cierra el camino **sin enlace**: es la página que se está viendo. Una publicación sin
 * categoría —los 10 anuncios— deja el camino en `Inicio › título`, que sigue siendo un camino.
 */
export async function postBreadcrumbs({
  categoryKey,
  title,
  homeLabel,
  locale,
}: {
  categoryKey: string | null | undefined;
  title: string;
  homeLabel: string;
  locale: AppLocale;
}): Promise<Breadcrumbs> {
  const steps = categoryKey
    ? await categorySteps(categoryKey, locale)
    : { crumbs: [], jsonLdItems: [] };
  const start = home(homeLabel);

  return {
    crumbs: [start.crumb, ...steps.crumbs, { label: title }],
    jsonLdItems: [start.item, ...steps.jsonLdItems, { name: title }],
  };
}

function home(label: string): { crumb: Crumb; item: BreadcrumbItem } {
  return {
    crumb: { label, href: "/" },
    item: { name: label, url: absoluteUrl(CANONICAL_URL, "/") },
  };
}

/** Un paso por cada categoría del camino, de la raíz a la más específica. */
async function categorySteps(
  key: string,
  locale: AppLocale,
): Promise<Breadcrumbs> {
  const taxonomy = await getCategoryTaxonomy();
  const crumbs: Crumb[] = [];
  const jsonLdItems: BreadcrumbItem[] = [];

  for (const step of categoryTrail(taxonomy, key)) {
    const label = labelFor(taxonomy, step, locale) ?? step;
    const href = {
      pathname: "/categoria/[key]" as const,
      params: { key: step },
    };

    crumbs.push({ label, href });
    jsonLdItems.push({
      name: label,
      url: absoluteUrl(CANONICAL_URL, getPathname({ href, locale })),
    });
  }

  return { crumbs, jsonLdItems };
}
