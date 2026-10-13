import type { Crumb } from "~/presentation/navigation/Breadcrumbs";

/** Las etiquetas de los tramos fijos, ya traducidas: el camino no lee el catálogo. */
export interface OutreachTrailLabels {
  home: string;
  outreach: string;
  groups: string;
}

/**
 * `Inicio / Difusión en grupos / …`: el camino de toda pantalla de difusión.
 *
 * Es una función y no una lista escrita en cada página para que las siete digan lo mismo en sus
 * tramos comunes. El último paso es la página que se ve y no lleva enlace (lo decide `Breadcrumbs`).
 */
export function outreachTrail(
  labels: OutreachTrailLabels,
  ...steps: Crumb[]
): Crumb[] {
  return [
    { label: labels.home, href: "/" },
    { label: labels.outreach, href: "/admin/difusion" },
    ...steps,
  ];
}

/** `Inicio / Difusión en grupos / Grupos / …`. */
export function groupsTrail(
  labels: OutreachTrailLabels,
  ...steps: Crumb[]
): Crumb[] {
  return outreachTrail(
    labels,
    { label: labels.groups, href: "/admin/difusion/grupos" },
    ...steps,
  );
}
