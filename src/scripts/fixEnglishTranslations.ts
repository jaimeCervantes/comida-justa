import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Arregla a mano los defectos que dejó la traducción automática al inglés.
 *
 * Las 23 filas `en` las escribió Gemini y nadie las había leído una por una (ver
 * `docs/features/pendientes.md`). La lectura completa del 2026-08-08 encontró cuatro cosas, todas
 * en producto que **se vende**:
 *
 *  1. **Frases pegadas sin espacio.** El traductor unió oraciones: "don't stop.It's the natural".
 *     Se ve en la ficha, y es lo único que un cliente notaría como "esto está mal hecho".
 *  2. **"Dorado" traducido a "Golden".** Es el nombre propio de un aderezo de la casa, no un color.
 *     Un cliente que pida "the Golden dressing" no se va a hacer entender en el mostrador. Además
 *     era inconsistente: el Omelet sí lo dejó como "Dorado".
 *  3. **"arándanos" → "blueberries" en una sola ficha** y "cranberries" en las otras tres, con la
 *     misma lista de ingredientes. Uno de los dos está mal; en un Super Bowl mexicano son
 *     arándanos deshidratados, o sea cranberries.
 *  4. **"Grasas Buenas" → "Healthy Fats" en una** y "Good Fats" en las otras dos. Misma frase, misma
 *     plantilla.
 *
 * Y un quinto que **no** se toca: el título en español dice "Eléctrolitos" y la palabra es
 * "electrolitos", sin acento. Corregirlo cambia contenido de origen, su slug y su URL indexada —
 * eso es decisión del dueño del contenido, no de un script.
 *
 * **Reversible.** Antes de escribir guarda las filas afectadas en
 * `src/scripts/backups/en-translations-<timestamp>.json`, y deja el `embedding` en `NULL` para que
 * `pnpm run backfill-embeddings` lo regenere: un vector calculado sobre el texto viejo describe un
 * texto que ya no existe.
 *
 *   pnpm exec tsx src/scripts/fixEnglishTranslations.ts --dry-run
 *   pnpm exec tsx src/scripts/fixEnglishTranslations.ts
 */

type Replacement = {
  /** El slug **español**, que es el estable: identifica la publicación sin depender del inglés. */
  postSlug: string;
  find: string;
  replace: string;
  why: string;
};

const REPLACEMENTS: readonly Replacement[] = [
  // 1 — frases pegadas
  {
    postSlug: "electrolitos-de-frutos-rojos",
    find: "don't stop.It's",
    replace: "don't stop. It's",
    why: "falta el espacio tras el punto",
  },
  {
    postSlug: "electrolitos-de-frutos-rojos",
    find: "refined sugars.A balanced",
    replace: "refined sugars. A balanced",
    why: "falta el espacio tras el punto",
  },
  {
    postSlug: "electrolitos-de-frutos-rojos",
    find: "muscles going.Pure energy",
    replace: "muscles going. Pure energy",
    why: "falta el espacio tras el punto",
  },
  {
    postSlug: "pan-de-masa-madre-natural",
    find: "industrial yeasts.Fermentation",
    replace: "industrial yeasts. Fermentation",
    why: "falta el espacio tras el punto",
  },
  {
    postSlug: "pan-de-masa-madre-natural",
    find: "energy release.Hazlo Sano",
    replace: "energy release. Hazlo Sano",
    why: "falta el espacio tras el punto",
  },

  // 2 — el nombre propio del aderezo
  {
    postSlug: "pechuga-de-pollo-a-la-macha-en-bistec",
    find: "- Golden",
    replace: "- Dorado",
    why: "«Dorado» es el nombre del aderezo, no un color",
  },
  {
    postSlug: "pechuga-de-pollo-a-la-naranja-en-bistec",
    find: "- Golden",
    replace: "- Dorado",
    why: "«Dorado» es el nombre del aderezo, no un color",
  },
  {
    postSlug: "pechuga-de-pollo-asada-en-bistec",
    find: "- Golden",
    replace: "- Dorado",
    why: "«Dorado» es el nombre del aderezo, no un color",
  },

  // 3 — la fruta que cambió de especie
  {
    postSlug: "pechuga-de-pollo-asada-en-bistec",
    find: "almonds, blueberries,",
    replace: "almonds, cranberries,",
    why: "«arándanos» es cranberries en las otras tres fichas iguales",
  },

  // 4 — la misma frase, dos traducciones
  {
    postSlug: "pechuga-de-pollo-a-la-macha-en-bistec",
    find: "muscle recovery and Healthy Fats",
    replace: "muscle recovery and Good Fats",
    why: "«Grasas Buenas» es Good Fats en las otras dos fichas iguales",
  },
];

/** Títulos que cambian enteros. El slug **no** se toca: ya está publicado. */
const TITLES: ReadonlyArray<{ postSlug: string; title: string; why: string }> =
  [
    {
      postSlug: "pechuga-de-pollo-a-la-naranja-en-bistec",
      title: "Orange Chicken Breast Steak",
      why: "las otras dos del mismo trío están en singular, y el español también",
    },
  ];

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  const { db } = await import("~/infra/dataAccess/db/connection");
  const { sql } = await import("drizzle-orm");

  const slugs = [
    ...new Set([
      ...REPLACEMENTS.map((r) => r.postSlug),
      ...TITLES.map((t) => t.postSlug),
    ]),
  ];

  /* `IN (…)` con un marcador por slug y no `= ANY($1)`: drizzle no serializa el array de JS como
     `text[]`, y Postgres contesta «op ANY/ALL (array) requires array on right side». */
  const slugList = sql.join(
    slugs.map((slug) => sql`${slug}`),
    sql`, `,
  );

  const current = await db.execute(sql`
    SELECT en.id, en.post_id, en.title, en.content, es.slug AS es_slug
    FROM post_translations es
    JOIN post_translations en ON en.post_id = es.post_id AND en.locale = 'en'
    WHERE es.locale = 'es' AND es.slug IN (${slugList})
  `);

  const rows = current.rows as unknown as Array<{
    id: string;
    post_id: string;
    title: string;
    content: string;
    es_slug: string;
  }>;

  const missing = slugs.filter((s) => !rows.some((r) => r.es_slug === s));
  if (missing.length > 0) {
    console.error(`ERROR: no se encontraron estas publicaciones: ${missing}`);
    process.exit(1);
  }

  const backupPath = resolve(
    process.cwd(),
    `src/scripts/backups/en-translations-${rows.length}-rows.json`,
  );
  writeFileSync(backupPath, JSON.stringify(rows, null, 2), "utf8");
  console.log(`Respaldo de ${rows.length} filas → ${backupPath}\n`);

  let applied = 0;
  let notFound = 0;

  for (const row of rows) {
    const mine = REPLACEMENTS.filter((r) => r.postSlug === row.es_slug);
    const newTitle = TITLES.find((t) => t.postSlug === row.es_slug)?.title;
    let content = row.content;

    for (const { find, replace, why } of mine) {
      if (!content.includes(find)) {
        console.warn(
          `  ⚠ ${row.es_slug}: no aparece «${find}» — ya arreglado?`,
        );
        notFound += 1;
        continue;
      }
      content = content.replaceAll(find, replace);
      console.log(`  ✓ ${row.es_slug}: «${find}» → «${replace}»  (${why})`);
      applied += 1;
    }

    if (newTitle && newTitle !== row.title) {
      console.log(`  ✓ ${row.es_slug}: título «${row.title}» → «${newTitle}»`);
      applied += 1;
    }

    const titleChanged = Boolean(newTitle) && newTitle !== row.title;
    if (content === row.content && !titleChanged) continue;

    if (dryRun) continue;

    /* El embedding se anula porque describía el texto anterior. Vale más un hueco que un vector
       que miente: `backfill-embeddings` sabe encontrar las traducciones sin indexar. */
    await db.execute(sql`
      UPDATE post_translations
      SET title = ${newTitle ?? row.title},
          content = ${content},
          embedding = NULL
      WHERE id = ${row.id}::uuid
    `);
  }

  console.log("\n------------------------------------------------");
  console.log(`Cambios ${dryRun ? "que se harían" : "aplicados"}: ${applied}`);
  if (notFound > 0) console.log(`No encontrados: ${notFound}`);

  if (!dryRun && applied > 0) {
    console.log("\nLos embeddings de esas filas quedaron en NULL. Corre:");
    console.log("  pnpm run backfill-embeddings");
    console.log(`\nPara deshacer: las filas originales están en ${backupPath}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Falló:", err);
    process.exit(1);
  });
