import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Abre dos ramas nuevas del catálogo: cuidado personal y hogar y limpieza.
 *
 * Las necesita el catálogo importado de los proveedores. Kian surte alimento, cuidado personal y
 * limpieza en la misma tienda, así que 124 de sus productos entraron sin categoría: ninguna de las
 * cuatro raíces —que son los cuatro pilares— describe un jabón ni un detergente.
 *
 * **Son raíces sin pilar, y es a propósito.** Se evaluó colgarlas de `alimentacion` con el argumento
 * de que un desodorante también entra al cuerpo, y se descartó por dos razones: las sub-categorías
 * heredan la raíz (`subtreeKeys`), así que quien filtra Alimentación para comer se encontraría 71
 * jabones; y renombrar el pilar toca 12 cadenas de `es.json`, 24 de `en.json` y una URL que ya está
 * en el sitemap.
 *
 * El código ya lo contempla, no hace falta tocarlo:
 * - `publicationPillarForCategory` devuelve `null` fuera de los cuatro, y ahí no pinta insignia
 *   «en vez de inventar un pilar».
 * - `navigableCategories` toma las hijas de cualquier raíz nueva sin cambios.
 *
 * **Es configuración, no esquema**: `categories` se llena sin migración, igual que desde
 * `/admin/catalogo`. Y es **idempotente**: se consulta lo que ya existe antes de crear nada.
 *
 * Uso: `pnpm run seed:home-care-categories [-- --dry-run]`
 */

interface SeedCategory {
  key: string;
  /** `null` en las raíces. */
  parentKey: string | null;
  es: string;
  en: string;
}

/**
 * El orden importa: cada raíz va antes que sus hijas, porque `createCategory` deduce el `level` del
 * padre y el trigger de la base rechaza una hija cuyo padre todavía no existe.
 */
const CATEGORIES: readonly SeedCategory[] = [
  {
    key: "cuidado_personal",
    parentKey: null,
    es: "Cuidado personal",
    en: "Personal care",
  },
  {
    key: "higiene_personal",
    parentKey: "cuidado_personal",
    es: "Higiene personal",
    en: "Personal hygiene",
  },
  {
    key: "cuidado_de_la_piel",
    parentKey: "cuidado_personal",
    es: "Cuidado de la piel",
    en: "Skin care",
  },
  {
    key: "bano_y_relajacion",
    parentKey: "cuidado_personal",
    es: "Baño y relajación",
    en: "Bath and relaxation",
  },

  {
    key: "hogar_y_limpieza",
    parentKey: null,
    es: "Hogar y limpieza",
    en: "Home and cleaning",
  },
  {
    key: "limpieza_del_hogar",
    parentKey: "hogar_y_limpieza",
    es: "Limpieza del hogar",
    en: "Home cleaning",
  },
  {
    key: "cuidado_de_la_ropa",
    parentKey: "hogar_y_limpieza",
    es: "Cuidado de la ropa",
    en: "Laundry care",
  },
];

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");

  if (dryRun) {
    console.log("DRY RUN — no se escribe nada en la base de datos.\n");
    for (const category of CATEGORIES) {
      const prefix = category.parentKey ? "    " : "  ";
      console.log(
        `${prefix}${category.key}  [${category.es} / ${category.en}]`,
      );
    }
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: falta DATABASE_URL.");
    process.exit(1);
  }

  const { db } = await import("~/infra/dataAccess/db/connection");
  const { categories } = await import(
    "~/infra/dataAccess/db/schema/categories"
  );
  const { createCategoryTaxonomyRepository } = await import(
    "~/infra/dataAccess/categories/factory"
  );

  /*
   * `createCategory` hace un INSERT pelón, así que la idempotencia se resuelve aquí: se lee una vez
   * lo que ya existe y se saltan esas claves. Correr el script dos veces no debe fallar ni pisar una
   * etiqueta que alguien haya ajustado a mano desde `/admin/catalogo`.
   */
  const existing = new Set(
    (await db.select({ key: categories.key }).from(categories)).map(
      (row) => row.key,
    ),
  );

  const repository = createCategoryTaxonomyRepository();
  let created = 0;
  let skipped = 0;

  for (const category of CATEGORIES) {
    if (existing.has(category.key)) {
      console.log(`  ya existe, se omite: ${category.key}`);
      skipped++;
      continue;
    }

    await repository.createCategory({
      key: category.key,
      parentKey: category.parentKey,
      labels: { es: category.es, en: category.en },
    });

    // Se añade al conjunto para que una hija no se rechace por creerse huérfana en esta misma corrida.
    existing.add(category.key);
    console.log(
      `  creada: ${category.key}${category.parentKey ? ` (bajo ${category.parentKey})` : " (raíz)"}`,
    );
    created++;
  }

  console.log(`\nCreadas ${created}, omitidas ${skipped}.`);
  console.log("Revisa /admin/catalogo y el selector de /publicar.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("El seed falló:", error);
    process.exit(1);
  });
