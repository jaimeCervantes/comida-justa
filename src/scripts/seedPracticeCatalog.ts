/**
 * Siembra el catálogo de prácticas: los cuatro pilares, los 116 estudios y las prácticas de Sueño.
 *
 * **Es contenido, no esquema.** Las seis tablas las creó Alembic
 * (`0049_2026-09-04_add_practice_catalog.py`) y este script las llena. Es **idempotente**: correrlo
 * dos veces no duplica nada y refresca la metadata de los estudios.
 *
 * Los DOIs se leen de `references.ts` —la misma lista que hoy pinta la bibliografía— y su título,
 * revista y año se piden a Crossref, que no necesita clave. Un DOI que Crossref no conozca se
 * registra igual con el resto nulo: se pierde el título, nunca el enlace, así que en el peor caso la
 * entrada queda como está hoy.
 *
 * Uso: `pnpm run seed:practice-catalog`
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import {
  MIND_SPIRIT_REFERENCES,
  MOVEMENT_REFERENCES,
  NUTRITION_REFERENCES,
  SLEEP_REFERENCES,
} from "~/app/[locale]/pilares/components/references";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import {
  PILLAR_SEED,
  type PracticeSeed,
  type PracticeTranslationSeed,
  SLEEP_PRACTICE_SEED,
} from "./data/practiceCatalogSeed";

config({ path: resolve(process.cwd(), ".env.development") });

const DOI_PREFIX = "https://doi.org/";
const CROSSREF = "https://api.crossref.org/works/";
const CONTACT = "hazlo.sano.comunidad@gmail.com";

type StudyMetadata = {
  title: string | null;
  journal: string | null;
  year: number | null;
  design: string | null;
};

/** El identificador es el DOI; la URL es sólo una forma de resolverlo. */
function toDoi(reference: string): string {
  return reference.startsWith(DOI_PREFIX)
    ? reference.slice(DOI_PREFIX.length)
    : reference;
}

/**
 * Crossref devuelve el nombre de la revista con entidades HTML sin resolver —`Metabolism &amp;
 * …`—, y pintarlas tal cual dejaría el ampersand crudo a la vista en la bibliografía.
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

async function seedPillars(db: Database): Promise<number> {
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
  return PILLAR_SEED.length;
}

/**
 * Qué estudios forman el cuerpo de evidencia de cada pilar.
 *
 * Es la lista que hoy pinta `PillarReferences`, leída del mismo sitio del que sale hoy. No se
 * deriva de `practice_studies`: de los 43 del descanso, sólo 13 sostienen una acción concreta, y
 * meter los otros 30 ahí habría sido afirmar que un artículo de posición te dice qué hacer.
 */
const PILLAR_BIBLIOGRAPHY: readonly {
  pillar: PillarKey;
  references: readonly string[];
}[] = [
  { pillar: "sleep", references: SLEEP_REFERENCES },
  { pillar: "nutrition", references: NUTRITION_REFERENCES },
  { pillar: "movement", references: MOVEMENT_REFERENCES },
  { pillar: "mindSpirit", references: MIND_SPIRIT_REFERENCES },
];

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

async function seedTranslation(
  db: Database,
  practiceKey: string,
  locale: "es" | "en",
  copy: PracticeTranslationSeed,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO practice_translations (practice_id, locale, title, summary, how_to, safety_note)
    SELECT p.id, ${locale}, ${copy.title}, ${copy.summary}, ${copy.howTo ?? null}, ${copy.safetyNote ?? null}
    FROM practices p WHERE p.key = ${practiceKey}
    ON CONFLICT ON CONSTRAINT uq_practice_translations_locale DO UPDATE
      SET title       = EXCLUDED.title,
          summary     = EXCLUDED.summary,
          how_to      = EXCLUDED.how_to,
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

  for (const doi of practice.dois) {
    await db.execute(sql`
      INSERT INTO practice_studies (practice_id, study_id)
      SELECT p.id, s.id
      FROM practices p, studies s
      WHERE p.key = ${practice.key} AND s.doi = ${doi}
      ON CONFLICT DO NOTHING
    `);
  }
}

async function main(): Promise<void> {
  const { db } = await import("~/infra/dataAccess/db/connection");

  const bibliography = PILLAR_BIBLIOGRAPHY.map(({ pillar, references }) => ({
    pillar,
    dois: references.map(toDoi),
  }));
  const dois = [...new Set(bibliography.flatMap(({ dois: list }) => list))];

  const pillars = await seedPillars(db);
  console.log(`Pilares sembrados: ${pillars}`);

  console.log(`Pidiendo metadata de ${dois.length} DOIs a Crossref…`);
  const { withTitle, withoutTitle } = await seedStudies(db, dois);
  console.log(`Estudios con título: ${withTitle} de ${dois.length}`);
  if (withoutTitle.length > 0) {
    console.log(
      `Sin metadata (conservan su enlace): ${withoutTitle.join(", ")}`,
    );
  }

  for (const { pillar, dois: list } of bibliography) {
    await seedPillarBibliography(db, pillar, list);
  }
  console.log(
    `Bibliografía por pilar: ${bibliography.map(({ pillar, dois: l }) => `${pillar}=${l.length}`).join(", ")}`,
  );

  for (const practice of SLEEP_PRACTICE_SEED) {
    await seedPractice(db, practice);
  }
  console.log(`Prácticas de Sueño sembradas: ${SLEEP_PRACTICE_SEED.length}`);

  const summary = await db.execute(sql`
    SELECT pp.pillar_key,
           COUNT(DISTINCT pp.practice_id)::int AS practicas,
           COUNT(ps.study_id)::int             AS citas
    FROM practice_pillars pp
    LEFT JOIN practice_studies ps ON ps.practice_id = pp.practice_id
    GROUP BY 1 ORDER BY 1
  `);
  console.log("Por pilar:", JSON.stringify(summary.rows));

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
