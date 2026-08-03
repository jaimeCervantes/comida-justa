import type { CategoryBranch } from "~/domain/entities/post/taxonomy";
import type { AppHref } from "~/i18n/navigation";

/**
 * El menú móvil como datos: enlaces y puertas a más enlaces.
 *
 * Está aparte del componente porque es lo único de este menú que se puede probar sin navegador, y
 * porque el árbol dejó de ser una lista con dos acordeones: hoy tiene tres niveles —el menú, «Por
 * categoría» y las sub-categorías de cada raíz—, y esa forma es una decisión que conviene poder
 * leer de un tirón.
 */
export type MenuEntry =
  | { kind: "link"; id: string; label: string; href: AppHref }
  | { kind: "panel"; id: string; label: string; entries: MenuEntry[] };

export interface CategoryMenuLabels {
  /** El título del nivel que agrupa las categorías. */
  byCategory: string;
}

/**
 * Las categorías, agrupadas por su raíz.
 *
 * **Una raíz con hijas es una puerta; una raíz sin hijas es un enlace.** Hoy `alimentacion` tiene
 * ocho sub-categorías y `movimiento_y_ejercicio` ninguna: meter la segunda tras una puerta que da
 * a una lista vacía sería un toque para no llegar a nada.
 */
export function categoryEntries(
  branches: readonly CategoryBranch[],
): MenuEntry[] {
  return branches.map((branch) =>
    branch.children.length > 0
      ? {
          kind: "panel" as const,
          id: `category:${branch.value}`,
          label: branch.label,
          entries: branch.children.map((child) =>
            categoryLink(child.value, child.label),
          ),
        }
      : categoryLink(branch.value, branch.label),
  );
}

function categoryLink(key: string, label: string): MenuEntry {
  return {
    kind: "link",
    id: `category:${key}`,
    label,
    href: { pathname: "/categoria/[key]", params: { key } },
  };
}

/** El panel al que lleva un camino de identificadores; `null` si el camino ya no existe. */
export function panelAt(
  entries: readonly MenuEntry[],
  path: readonly string[],
): Extract<MenuEntry, { kind: "panel" }> | null {
  let current: Extract<MenuEntry, { kind: "panel" }> | null = null;
  let level: readonly MenuEntry[] = entries;

  for (const id of path) {
    const found = level.find(
      (entry): entry is Extract<MenuEntry, { kind: "panel" }> =>
        entry.kind === "panel" && entry.id === id,
    );

    if (!found) return null;

    current = found;
    level = found.entries;
  }

  return current;
}
