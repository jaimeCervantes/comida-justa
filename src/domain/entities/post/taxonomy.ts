/**
 * La taxonomía de categorías, tal como vive en la base (`categories`,
 * `category_translations`, `category_aliases`).
 *
 * Reemplaza a la allowlist en constantes: la clave dejó de ser un literal de TypeScript y pasó a
 * ser un dato. Se pierde el union type `PostSubCategory` —el compilador ya no avisa— y a cambio la
 * validación pasa de "¿está en esta constante?" a "¿existe esta clave activa?", respaldada por el
 * FK. El error se descubre en test o runtime, no al escribir.
 *
 * Este módulo es puro: no conoce React, Next ni Drizzle.
 */

/** Idiomas con etiqueta. Coincide con el CHECK de `category_translations.locale`. */
export type CategoryLocale = "es" | "en";

export const DEFAULT_CATEGORY_LOCALE: CategoryLocale = "es";

/** Raíz (categoría) u hoja (sub-categoría). El catálogo es de dos niveles, impuesto por trigger. */
export type CategoryLevel = 1 | 2;

export interface CategoryNode {
  key: string;
  /** `null` en las raíces. */
  parentKey: string | null;
  level: CategoryLevel;
  isActive: boolean;
  sortOrder: number;
  /** Etiqueta por locale, tal como está en `category_translations`. */
  labels: Readonly<Partial<Record<CategoryLocale, string>>>;
}

export interface CategoryAlias {
  /** Ya normalizado, como `category_aliases.alias_normalized`. */
  aliasNormalized: string;
  categoryKey: string;
}

/**
 * Lo que viaja por el caché de Next, que guarda **JSON**: sin `Map`, sin `Set`, sin clases.
 * Los índices se construyen aparte, con `createCategoryTaxonomy`.
 */
export interface CategoryTaxonomySnapshot {
  nodes: readonly CategoryNode[];
  aliases: readonly CategoryAlias[];
}

/** La instantánea ya indexada. Es lo que consume el resto de la app. */
export interface CategoryTaxonomy {
  readonly nodes: ReadonlyMap<string, CategoryNode>;
  readonly aliasesByNormalized: ReadonlyMap<string, string>;
  /** Claves activas por `parentKey` (`""` agrupa las raíces), ya en orden canónico. */
  readonly childrenByParent: ReadonlyMap<string, readonly string[]>;
}

const ROOT_BUCKET = "";

/** Marcas de acento que deja `normalize("NFD")` al separar la letra base de su diacrítico. */
const DIACRITICS = /[̀-ͯ]/g;

/**
 * Espejo en TypeScript de la función SQL `category_normalize`: minúsculas, sin acentos y sin
 * espacios alrededor.
 *
 * A diferencia de `legacyLabelToKey`, **no** elimina espacios ni signos interiores: la base
 * tampoco lo hace, y una etiqueta como "Frutas y Verduras" tiene que normalizar igual de los dos
 * lados o la búsqueda encontraría cosas distintas según quién resuelva.
 *
 * `NFD` cubre más diacríticos que el `translate` del SQL, pero para el conjunto latino que usa
 * este catálogo ambos coinciden.
 */
export function normalizeCategoryKey(value: string | null | undefined): string {
  if (!value) return "";

  return value.normalize("NFD").replace(DIACRITICS, "").trim().toLowerCase();
}

function sortNodes(a: CategoryNode, b: CategoryNode): number {
  return a.sortOrder - b.sortOrder || a.key.localeCompare(b.key);
}

export function createCategoryTaxonomy(
  snapshot: CategoryTaxonomySnapshot,
): CategoryTaxonomy {
  const nodes = new Map<string, CategoryNode>();
  for (const node of snapshot.nodes) nodes.set(node.key, node);

  const aliasesByNormalized = new Map<string, string>();
  for (const alias of snapshot.aliases) {
    // Un alias que apunta a una clave inexistente se ignora en vez de romper la construcción:
    // la base lo impide con un FK, pero el fallback se escribe a mano.
    if (nodes.has(alias.categoryKey)) {
      aliasesByNormalized.set(alias.aliasNormalized, alias.categoryKey);
    }
  }

  const childrenByParent = new Map<string, CategoryNode[]>();
  for (const node of snapshot.nodes) {
    if (!node.isActive) continue;
    const bucket = node.parentKey ?? ROOT_BUCKET;
    const siblings = childrenByParent.get(bucket);
    if (siblings) siblings.push(node);
    else childrenByParent.set(bucket, [node]);
  }

  const orderedChildren = new Map<string, readonly string[]>();
  for (const [bucket, siblings] of childrenByParent) {
    orderedChildren.set(
      bucket,
      siblings.sort(sortNodes).map((node) => node.key),
    );
  }

  return { nodes, aliasesByNormalized, childrenByParent: orderedChildren };
}

export function isActiveKey(
  taxonomy: CategoryTaxonomy,
  key: string | null | undefined,
): boolean {
  if (!key) return false;
  return taxonomy.nodes.get(key)?.isActive === true;
}

/**
 * Lo que acepta `/publicar`. La comparación es exacta y solo contra claves activas: `"Jugos"`
 * (etiqueta) y `"JUGOS"` (mayúsculas) no pasan. Aceptar etiquetas aquí sería abrirle la puerta a
 * que entren en la base, que es justo lo que la columna evita al guardar la clave.
 */
export function resolveKeyStrict(
  taxonomy: CategoryTaxonomy,
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  return isActiveKey(taxonomy, raw) ? raw : null;
}

/**
 * Lo que acepta la búsqueda y la ingesta de datos heredados, donde el texto lo escribe una persona:
 * normaliza y prueba, en orden, la clave, un alias y la etiqueta en cualquier idioma.
 *
 * El orden importa: una clave siempre gana sobre un alias, y un alias sobre una etiqueta, para que
 * agregar un sinónimo nunca cambie el significado de algo que ya resolvía.
 */
export function resolveKeyLenient(
  taxonomy: CategoryTaxonomy,
  raw: string | null | undefined,
): string | null {
  const needle = normalizeCategoryKey(raw);
  if (!needle) return null;

  if (isActiveKey(taxonomy, needle)) return needle;

  const aliased = taxonomy.aliasesByNormalized.get(needle);
  if (aliased && isActiveKey(taxonomy, aliased)) return aliased;

  for (const node of taxonomy.nodes.values()) {
    if (!node.isActive) continue;
    for (const label of Object.values(node.labels)) {
      if (normalizeCategoryKey(label) === needle) return node.key;
    }
  }

  return null;
}

function normalizeLocale(locale: string | undefined): CategoryLocale {
  return locale === "en" || locale === "es" ? locale : DEFAULT_CATEGORY_LOCALE;
}

/**
 * La etiqueta en el idioma pedido, cayendo al idioma por defecto cuando esa traducción falta.
 * Una clave que no está en el catálogo no tiene etiqueta: devuelve `null` en vez de inventarla.
 */
export function labelFor(
  taxonomy: CategoryTaxonomy,
  key: string | null | undefined,
  locale?: string,
): string | null {
  if (!key) return null;

  const node = taxonomy.nodes.get(key);
  if (!node) return null;

  return (
    node.labels[normalizeLocale(locale)] ??
    node.labels[DEFAULT_CATEGORY_LOCALE] ??
    null
  );
}

export interface CategoryOption {
  value: string;
  label: string;
}

/**
 * Opciones de un selector, en el orden canónico del catálogo (`sort_order`), no alfabético.
 * `parentKey` en `null` devuelve las raíces; una clave devuelve sus hijas. Las inactivas no salen.
 */
export function optionsFor(
  taxonomy: CategoryTaxonomy,
  parentKey: string | null,
  locale?: string,
): readonly CategoryOption[] {
  const keys = taxonomy.childrenByParent.get(parentKey ?? ROOT_BUCKET) ?? [];

  return keys.map((key) => ({
    value: key,
    label: labelFor(taxonomy, key, locale) ?? key,
  }));
}

/**
 * Las categorías que se ofrecen para navegar, aplanadas.
 *
 * El menú no reproduce la jerarquía: hoy hay **una sola raíz** (`alimentacion`) con siete hijas,
 * así que un nivel intermedio con un único elemento sería un clic de más para llegar al mismo
 * sitio. Se devuelven las hojas.
 *
 * No se codifica esa forma, se deriva: de cada raíz salen sus hijas, y una raíz sin hijas se
 * ofrece ella misma. El día que aparezca una segunda raíz, sus hijas entran en la lista sin tocar
 * este código — sin ordenarlas por su cuenta, porque el orden canónico (`sort_order`) ya viene
 * dado y agruparlas por raíz es decisión de quien las pinte.
 */
export function navigableCategories(
  taxonomy: CategoryTaxonomy,
  locale?: string,
): readonly CategoryOption[] {
  const roots = taxonomy.childrenByParent.get(ROOT_BUCKET) ?? [];

  return roots.flatMap((rootKey) => {
    const children = optionsFor(taxonomy, rootKey, locale);

    return children.length > 0
      ? children
      : [
          {
            value: rootKey,
            label: labelFor(taxonomy, rootKey, locale) ?? rootKey,
          },
        ];
  });
}

/**
 * La clave y sus hijas activas, que es lo que significa filtrar por una categoría: pedir
 * `alimentacion` trae también sus sub-categorías; pedir `jugos` trae solo `jugos`.
 * Espejo de la función SQL `category_subtree_keys`.
 */
export function subtreeKeys(
  taxonomy: CategoryTaxonomy,
  key: string | null | undefined,
): readonly string[] {
  if (!isActiveKey(taxonomy, key)) return [];

  return [
    key as string,
    ...(taxonomy.childrenByParent.get(key as string) ?? []),
  ];
}
