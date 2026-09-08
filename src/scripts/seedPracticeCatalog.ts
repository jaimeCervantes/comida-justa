/**
 * Siembra el catálogo de prácticas: los cuatro pilares, los 116 estudios y las 45 prácticas.
 *
 * **Es contenido, no esquema.** Las siete tablas las creó Alembic (`0049` y `0050`) y este script
 * las llena. Es **idempotente**: correrlo dos veces no duplica nada y refresca la metadata de los
 * estudios.
 *
 * El título, la revista y el año de cada DOI se piden a Crossref, que no necesita clave. Un DOI que
 * Crossref no conozca se registra igual con el resto nulo: se pierde el título, nunca el enlace, así
 * que en el peor caso la entrada queda como estaba antes de existir este catálogo.
 *
 * Uso: `pnpm run seed:practice-catalog`
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import { PILLAR_THEME_SEED } from "./data/pillarThemes";
import {
  PILLAR_SEED,
  PRACTICE_SEED,
  RETIRED_PRACTICE_KEYS,
} from "./data/practiceCatalogSeed";
import type {
  PracticeSeed,
  PracticeTranslationSeed,
} from "./data/practiceSeed";

config({ path: resolve(process.cwd(), ".env.development") });

const CROSSREF = "https://api.crossref.org/works/";
const CONTACT = "hazlo.sano.comunidad@gmail.com";

type StudyMetadata = {
  title: string | null;
  journal: string | null;
  year: number | null;
  design: string | null;
};

/**
 * Crossref devuelve el nombre de la revista con entidades HTML sin resolver —`Metabolism &amp;
 * …`— y a veces con etiquetas dentro del título (`<scp>A</scp>sia`, `<sup>†</sup>`). Pintarlas tal
 * cual dejaría el marcado a la vista en la bibliografía.
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * El diseño del estudio, cuando el propio artículo se nombra así en su título.
 *
 * **No se deduce, se lee.** Un metaanálisis lo dice en la portada; un ensayo no siempre, y adivinar
 * cuál lo es a partir del tema sería fabricar autoridad — exactamente lo que este catálogo existe
 * para evitar. Lo que no consta se queda nulo.
 */
function designFromTitle(title: string | null): string | null {
  if (!title) return null;
  if (/meta-?analysis/i.test(title)) return "meta_analysis";
  if (/systematic review/i.test(title)) return "systematic_review";
  if (/position statement|guideline/i.test(title)) return "guideline";
  return null;
}

async function fetchMetadata(doi: string): Promise<StudyMetadata> {
  const empty: StudyMetadata = {
    title: null,
    journal: null,
    year: null,
    design: null,
  };

  try {
    const response = await fetch(`${CROSSREF}${encodeURI(doi)}`, {
      headers: { "User-Agent": `comida-justa/1.0 (mailto:${CONTACT})` },
    });
    if (!response.ok) return empty;

    const message = (await response.json()).message;
    const title = message.title?.[0] ? decodeEntities(message.title[0]) : null;
    const journal = message["container-title"]?.[0]
      ? decodeEntities(message["container-title"][0])
      : null;
    const year = message.issued?.["date-parts"]?.[0]?.[0] ?? null;

    return { title, journal, year, design: designFromTitle(title) };
  } catch {
    return empty;
  }
}

type Database = Awaited<
  typeof import("~/infra/dataAccess/db/connection")
>["db"];

async function seedPillars(db: Database): Promise<void> {
  for (const pillar of PILLAR_SEED) {
    await db.execute(sql`
      INSERT INTO pillars (key, category_key, slug, bot_intent, sort_order)
      VALUES (${pillar.key}, ${pillar.categoryKey}, ${pillar.slug}, ${pillar.botIntent}, ${pillar.sortOrder})
      ON CONFLICT (key) DO UPDATE
        SET category_key = EXCLUDED.category_key,
            slug         = EXCLUDED.slug,
            bot_intent   = EXCLUDED.bot_intent,
            sort_order   = EXCLUDED.sort_order
    `);
  }
}

async function seedStudies(
  db: Database,
  dois: readonly string[],
): Promise<{ withTitle: number; withoutTitle: string[] }> {
  const withoutTitle: string[] = [];
  let withTitle = 0;

  for (const doi of dois) {
    const { title, journal, year, design } = await fetchMetadata(doi);
    if (title) withTitle++;
    else withoutTitle.push(doi);

    /* `COALESCE(EXCLUDED.…, studies.…)`: una segunda corrida en la que Crossref no responda no
       puede borrar un título que ya estaba. Refrescar sí, degradar no. */
    await db.execute(sql`
      INSERT INTO studies (doi, title, journal, year, design)
      VALUES (${doi}, ${title}, ${journal}, ${year}, ${design})
      ON CONFLICT (doi) DO UPDATE
        SET title   = COALESCE(EXCLUDED.title,   studies.title),
            journal = COALESCE(EXCLUDED.journal, studies.journal),
            year    = COALESCE(EXCLUDED.year,    studies.year),
            design  = COALESCE(EXCLUDED.design,  studies.design)
    `);
  }

  return { withTitle, withoutTitle };
}

async function seedPillarBibliography(
  db: Database,
  pillar: PillarKey,
  dois: readonly string[],
): Promise<void> {
  for (const [index, doi] of dois.entries()) {
    await db.execute(sql`
      INSERT INTO pillar_studies (pillar_key, study_id, sort_order)
      SELECT ${pillar}, s.id, ${(index + 1) * 10}
      FROM studies s WHERE s.doi = ${doi}
      ON CONFLICT (pillar_key, study_id) DO UPDATE
        SET sort_order = EXCLUDED.sort_order
    `);
  }
}

async function seedTranslation(
  db: Database,
  practiceKey: string,
  locale: "es" | "en",
  copy: PracticeTranslationSeed,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO practice_translations (
      practice_id, locale, title, summary, cue, how_to, minimum, safety_note
    )
    SELECT p.id, ${locale}, ${copy.title}, ${copy.summary}, ${copy.cue ?? null},
           ${copy.howTo ?? null}, ${copy.minimum ?? null}, ${copy.safetyNote ?? null}
    FROM practices p WHERE p.key = ${practiceKey}
    ON CONFLICT ON CONSTRAINT uq_practice_translations_locale DO UPDATE
      SET title       = EXCLUDED.title,
          summary     = EXCLUDED.summary,
          cue         = EXCLUDED.cue,
          how_to      = EXCLUDED.how_to,
          minimum     = EXCLUDED.minimum,
          safety_note = EXCLUDED.safety_note
  `);
}

async function seedPractice(
  db: Database,
  practice: PracticeSeed,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO practices (key, challenge_key, effort_minutes, cost_level, status, published_at)
    VALUES (
      ${practice.key},
      ${practice.challengeKey ?? null},
      ${practice.effortMinutes ?? null},
      ${practice.costLevel},
      'published',
      now()
    )
    ON CONFLICT (key) DO UPDATE
      SET challenge_key  = EXCLUDED.challenge_key,
          effort_minutes = EXCLUDED.effort_minutes,
          cost_level     = EXCLUDED.cost_level,
          status         = EXCLUDED.status,
          published_at   = COALESCE(practices.published_at, EXCLUDED.published_at)
  `);

  await seedTranslation(db, practice.key, "es", practice.es);
  await seedTranslation(db, practice.key, "en", practice.en);

  /* El primero de la lista es el primario. Se borra y se reescribe en vez de hacer upsert: si una
     práctica cambia de pilar principal, un upsert dejaría la primaria vieja y el índice parcial
     rechazaría la nueva con un error que no dice nada. */
  await db.execute(sql`
    DELETE FROM practice_pillars
    WHERE practice_id = (SELECT id FROM practices WHERE key = ${practice.key})
  `);
  for (const [index, pillarKey] of practice.pillars.entries()) {
    await db.execute(sql`
      INSERT INTO practice_pillars (practice_id, pillar_key, is_primary)
      SELECT p.id, ${pillarKey}, ${index === 0}
      FROM practices p WHERE p.key = ${practice.key}
    `);
  }

  /* Las citas también se reescriben: quitar un DOI de la semilla tiene que quitarlo de la página, y
     un `ON CONFLICT DO NOTHING` sólo sabe añadir. */
  await db.execute(sql`
    DELETE FROM practice_studies
    WHERE practice_id = (SELECT id FROM practices WHERE key = ${practice.key})
  `);
  for (const doi of practice.dois) {
    await db.execute(sql`
      INSERT INTO practice_studies (practice_id, study_id)
      SELECT p.id, s.id
      FROM practices p, studies s
      WHERE p.key = ${practice.key} AND s.doi = ${doi}
    `);
  }
}

/** Las prácticas que se renombraron. Ver `RETIRED_PRACTICE_KEYS`. */
async function retireOldKeys(db: Database): Promise<number> {
  let removed = 0;
  for (const key of RETIRED_PRACTICE_KEYS) {
    const result = await db.execute(sql`
      DELETE FROM practices WHERE key = ${key}
    `);
    removed += result.rowCount ?? 0;
  }
  return removed;
}

/**
 * Los temas y la pertenencia de cada práctica a uno.
 *
 * Se siembra **después** de las prácticas porque `practices.theme_id` las necesita existiendo, y se
 * limpia antes: una práctica que sale de un tema tiene que salir también de la página, y un
 * `UPDATE` que sólo asigna no sabe desasignar.
 */
async function seedThemes(db: Database): Promise<void> {
  await db.execute(sql`UPDATE practices SET theme_id = NULL`);

  for (const theme of PILLAR_THEME_SEED) {
    await db.execute(sql`
      INSERT INTO pillar_themes (key, pillar_key, sort_order)
      VALUES (${theme.key}, ${theme.pillar}, ${theme.sortOrder})
      ON CONFLICT (key) DO UPDATE
        SET pillar_key = EXCLUDED.pillar_key,
            sort_order = EXCLUDED.sort_order
    `);

    for (const [locale, copy] of [
      ["es", theme.es],
      ["en", theme.en],
    ] as const) {
      await db.execute(sql`
        INSERT INTO pillar_theme_translations (theme_id, locale, title, body_impact, local_impact)
        SELECT t.id, ${locale}, ${copy.title}, ${copy.bodyImpact}, ${copy.localImpact}
        FROM pillar_themes t WHERE t.key = ${theme.key}
        ON CONFLICT ON CONSTRAINT uq_pillar_theme_translations_locale DO UPDATE
          SET title        = EXCLUDED.title,
              body_impact  = EXCLUDED.body_impact,
              local_impact = EXCLUDED.local_impact
      `);
    }

    for (const practiceKey of theme.practices) {
      await db.execute(sql`
        UPDATE practices
        SET theme_id = (SELECT id FROM pillar_themes WHERE key = ${theme.key})
        WHERE key = ${practiceKey}
      `);
    }
  }
}

async function main(): Promise<void> {
  const { db } = await import("~/infra/dataAccess/db/connection");

  const dois = [
    ...new Set(PILLAR_SEED.flatMap(({ bibliography }) => bibliography)),
  ];

  await seedPillars(db);
  console.log(`Pilares sembrados: ${PILLAR_SEED.length}`);

  console.log(`Pidiendo metadata de ${dois.length} DOIs a Crossref…`);
  const { withTitle, withoutTitle } = await seedStudies(db, dois);
  console.log(`Estudios con título: ${withTitle} de ${dois.length}`);
  if (withoutTitle.length > 0) {
    console.log(
      `Sin metadata (conservan su enlace): ${withoutTitle.join(", ")}`,
    );
  }

  for (const { key, bibliography } of PILLAR_SEED) {
    await seedPillarBibliography(db, key, bibliography);
  }

  const retired = await retireOldKeys(db);
  if (retired > 0) console.log(`Prácticas retiradas por renombre: ${retired}`);

  for (const practice of PRACTICE_SEED) {
    await seedPractice(db, practice);
  }
  console.log(`Prácticas sembradas: ${PRACTICE_SEED.length}`);

  await seedThemes(db);
  console.log(`Temas sembrados: ${PILLAR_THEME_SEED.length}`);

  /* `COUNT(DISTINCT …)` en las tres, y no `COUNT(*)`: el `LEFT JOIN` con las citas multiplica cada
     práctica por sus estudios, así que un `COUNT(*)` contaba filas del producto y no prácticas —23
     «propias» en Alimentación donde hay 12—. */
  const anchored = await db.execute(sql`
    SELECT COUNT(*) FILTER (WHERE cue IS NOT NULL)::int     AS con_ancla,
           COUNT(*) FILTER (WHERE minimum IS NOT NULL)::int AS con_minimo,
           COUNT(*)::int                                    AS traducciones
    FROM practice_translations
  `);
  console.log("Anclas:", JSON.stringify(anchored.rows[0]));

  const summary = await db.execute(sql`
    SELECT pp.pillar_key,
           COUNT(DISTINCT pp.practice_id) FILTER (WHERE pp.is_primary)::int AS propias,
           COUNT(DISTINCT pp.practice_id)::int                              AS practicas,
           COUNT(DISTINCT ps.study_id)::int                                 AS estudios_citados,
           (SELECT COUNT(*)::int FROM pillar_studies bs
             WHERE bs.pillar_key = pp.pillar_key)                           AS bibliografia
    FROM practice_pillars pp
    LEFT JOIN practice_studies ps ON ps.practice_id = pp.practice_id
    GROUP BY pp.pillar_key ORDER BY 1
  `);
  console.table(summary.rows);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
