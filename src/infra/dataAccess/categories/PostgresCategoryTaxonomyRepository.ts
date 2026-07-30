import { sql } from "drizzle-orm";
import type { NewCategoryInput } from "~/domain/entities/post/newCategory";
import type {
  CategoryAlias,
  CategoryLevel,
  CategoryLocale,
  CategoryNode,
  CategoryTaxonomySnapshot,
} from "~/domain/entities/post/taxonomy";
import { FALLBACK_CATEGORY_TAXONOMY } from "~/domain/entities/post/taxonomyFallback";
import { db } from "~/infra/dataAccess/db/connection";
import {
  categoryAliases,
  categoryLabels,
} from "~/infra/dataAccess/db/schema/categories";
import type ICategoryTaxonomyRepository from "~/use_cases/catalog/ports/ICategoryTaxonomyRepository";

/** Una fila de la vista `category_labels`: un nodo repetido por cada idioma que tiene etiqueta. */
type LabelRow = {
  key: string;
  parentKey: string | null;
  level: number;
  isActive: boolean;
  sortOrder: number;
  locale: string;
  label: string;
};

function isCategoryLocale(locale: string): locale is CategoryLocale {
  return locale === "es" || locale === "en";
}

/**
 * La vista devuelve un nodo por idioma; el dominio quiere un nodo con sus idiomas dentro.
 * Un idioma que la vista traiga y el dominio no conozca se ignora, para que agregar un locale en
 * la base no rompa un despliegue viejo.
 */
function toNodes(rows: readonly LabelRow[]): CategoryNode[] {
  const byKey = new Map<string, CategoryNode>();

  for (const row of rows) {
    let node = byKey.get(row.key);

    if (!node) {
      node = {
        key: row.key,
        parentKey: row.parentKey,
        level: (row.level === 1 ? 1 : 2) satisfies CategoryLevel,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        labels: {},
      };
      byKey.set(row.key, node);
    }

    if (isCategoryLocale(row.locale)) {
      (node.labels as Record<string, string>)[row.locale] = row.label;
    }
  }

  return [...byKey.values()];
}

export default class PostgresCategoryTaxonomyRepository
  implements ICategoryTaxonomyRepository
{
  async loadSnapshot(): Promise<CategoryTaxonomySnapshot> {
    try {
      const [labelRows, aliasRows] = await Promise.all([
        db
          .select({
            key: categoryLabels.key,
            parentKey: categoryLabels.parentKey,
            level: categoryLabels.level,
            isActive: categoryLabels.isActive,
            sortOrder: categoryLabels.sortOrder,
            locale: categoryLabels.locale,
            label: categoryLabels.label,
          })
          .from(categoryLabels),
        db
          .select({
            aliasNormalized: categoryAliases.aliasNormalized,
            categoryKey: categoryAliases.categoryKey,
          })
          .from(categoryAliases),
      ]);

      const nodes = toNodes(labelRows as LabelRow[]);

      // Cero nodos no es un catálogo vacío legítimo: es la migración sin aplicar. Degradar aquí es
      // lo que permite desplegar el sitio antes que la migración.
      if (nodes.length === 0) {
        console.warn(
          "[categorías] la tabla `categories` no devolvió filas; se usa la instantánea de respaldo",
        );
        return FALLBACK_CATEGORY_TAXONOMY;
      }

      const aliases: CategoryAlias[] = aliasRows
        .filter(
          (row): row is { aliasNormalized: string; categoryKey: string } =>
            Boolean(row.aliasNormalized),
        )
        .map((row) => ({
          aliasNormalized: row.aliasNormalized,
          categoryKey: row.categoryKey,
        }));

      return { nodes, aliases };
    } catch (error) {
      console.warn(
        "[categorías] no se pudo leer el catálogo; se usa la instantánea de respaldo",
        error,
      );
      return FALLBACK_CATEGORY_TAXONOMY;
    }
  }

  /**
   * La categoría y sus etiquetas van en **una sola transacción**: una categoría a medio crear —sin
   * traducción— se vería por su clave en toda la vitrina, y arreglarlo exigiría entrar a la base.
   *
   * El `level` se deduce del padre en vez de pedirlo: es información redundante que el formulario
   * podría contradecir, y el trigger de la base la rechazaría con un mensaje que nadie espera.
   */
  async createCategory(input: NewCategoryInput): Promise<void> {
    const key = input.key.trim();
    const level = input.parentKey ? 2 : 1;

    await db.transaction(async (tx) => {
      // `sort_order` la deja al final de sus hermanas: quien administra el catálogo decide el orden
      // después, y aparecer en medio sin haberlo pedido sería una sorpresa.
      await tx.execute(sql`
        INSERT INTO categories (key, parent_key, level, sort_order)
        VALUES (
          ${key},
          ${input.parentKey},
          ${level},
          COALESCE(
            (SELECT MAX(sort_order) + 10 FROM categories
             WHERE parent_key IS NOT DISTINCT FROM ${input.parentKey}),
            10
          )
        )
      `);

      for (const [locale, label] of Object.entries(input.labels)) {
        if (!label?.trim()) continue;

        await tx.execute(sql`
          INSERT INTO category_translations (category_key, locale, label)
          VALUES (${key}, ${locale}, ${label.trim()})
        `);
      }
    });
  }

  async setCategoryActive(key: string, isActive: boolean): Promise<void> {
    await db.execute(sql`
      UPDATE categories
      SET    is_active = ${isActive}, updated_at = now()
      WHERE  key = ${key}
    `);
  }
}
