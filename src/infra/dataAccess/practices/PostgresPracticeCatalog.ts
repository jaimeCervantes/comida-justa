import { sql } from "drizzle-orm";
import { cache } from "react";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { PracticeCard } from "~/domain/practices/practiceCard";
import { db } from "~/infra/dataAccess/db/connection";
import type {
  PillarTheme,
  PracticeCatalogRepository,
} from "~/use_cases/practices/ports/PracticeCatalogRepository";

/** El idioma al que se cae cuando una práctica todavía no está traducida. */
const FALLBACK_LOCALE = "es";

type ThemeRow = {
  key: string;
  title: string;
  body_impact: string;
  local_impact: string;
  practices: string[] | null;
};

type CatalogRow = {
  key: string;
  title: string;
  summary: string;
  cue: string | null;
  minimum: string | null;
  effort_minutes: number | null;
  cost_level: number | null;
  challenge_key: string | null;
  pillars: string[];
  study_count: number;
};

/**
 * El catálogo de prácticas publicadas, con su pilar y su evidencia.
 *
 * **Una fila por práctica, no por pilar.** Respirar despacio sirve a Mente y a Sueño, y aparecer dos
 * veces en la lista contaría como dos prácticas lo que es una — justo lo contrario de lo que el
 * modelo N:N vino a arreglar. Los pilares llegan agregados, con el primario delante.
 *
 * El orden es por pilar y luego por evidencia: dentro de un pilar, primero lo que más estudios
 * sostienen. No por esfuerzo ni por costo, que invitarían a leer la lista como un ranking de
 * facilidad; y no alfabético, que no dice nada.
 */
export class PostgresPracticeCatalog implements PracticeCatalogRepository {
  async listPublished(locale: string): Promise<readonly PracticeCard[]> {
    const result = await db.execute(sql`
      SELECT p.key,
             t.title,
             t.summary,
             t.cue,
             t.minimum,
             p.effort_minutes,
             p.cost_level,
             p.challenge_key,
             array_agg(pp.pillar_key ORDER BY pp.is_primary DESC, pp.pillar_key)
               AS pillars,
             (SELECT COUNT(*)::int FROM practice_studies ps
               WHERE ps.practice_id = p.id) AS study_count,
             pl.sort_order AS pillar_order
      FROM practices p
      -- Dos usos distintos de la misma tabla, y por eso dos JOINs: pp recorre TODOS los pilares a
      -- los que sirve la práctica, que es lo que agrega array_agg; main selecciona el primario, que
      -- decide bajo qué encabezado va y en qué orden.
      -- Estaban fundidos en un solo JOIN con "AND pp.is_primary", y esa condición filtraba también
      -- el agregado: la práctica compartida salía con un único pilar y su tarjeta no anunciaba
      -- ningún puente. Lo cazó el escenario de la práctica compartida, que existe para eso.
      JOIN practice_pillars pp ON pp.practice_id = p.id
      JOIN practice_pillars main
        ON main.practice_id = p.id AND main.is_primary
      JOIN pillars pl ON pl.key = main.pillar_key
      LEFT JOIN LATERAL (
        SELECT pt.title, pt.summary, pt.cue, pt.minimum
        FROM practice_translations pt
        WHERE pt.practice_id = p.id AND pt.locale IN (${locale}, ${FALLBACK_LOCALE})
        ORDER BY (pt.locale = ${locale}) DESC
        LIMIT 1
      ) t ON TRUE
      WHERE p.status = 'published' AND t.title IS NOT NULL
      GROUP BY p.id, t.title, t.summary, t.cue, t.minimum, pl.sort_order
      ORDER BY pl.sort_order, study_count DESC, t.title
    `);

    return (result.rows as CatalogRow[]).map(toCard);
  }

  async findPrimaryPillar(practiceKey: string): Promise<PillarKey | null> {
    const result = await db.execute(sql`
      SELECT pp.pillar_key
      FROM practices p
      JOIN practice_pillars pp ON pp.practice_id = p.id AND pp.is_primary
      WHERE p.key = ${practiceKey} AND p.status = 'published'
    `);
    const row = result.rows[0] as { pillar_key: string } | undefined;
    return (row?.pillar_key as PillarKey) ?? null;
  }

  /**
   * Los temas de un pilar, en el orden en que se construyó el catálogo.
   *
   * `LEFT JOIN` hacia las prácticas: un tema recién sembrado y todavía sin prácticas asignadas se
   * enseña con su título y sus dos impactos en vez de desaparecer sin decir por qué.
   */
  async listThemes(
    pillar: PillarKey,
    locale: string,
  ): Promise<readonly PillarTheme[]> {
    const result = await db.execute(sql`
      SELECT th.key,
             tt.title,
             tt.body_impact,
             tt.local_impact,
             COALESCE(
               array_agg(pt.title ORDER BY pt.title) FILTER (WHERE pt.title IS NOT NULL),
               ARRAY[]::text[]
             ) AS practices
      FROM pillar_themes th
      JOIN LATERAL (
        SELECT t.title, t.body_impact, t.local_impact
        FROM pillar_theme_translations t
        WHERE t.theme_id = th.id AND t.locale IN (${locale}, ${FALLBACK_LOCALE})
        ORDER BY (t.locale = ${locale}) DESC
        LIMIT 1
      ) tt ON TRUE
      LEFT JOIN practices p ON p.theme_id = th.id AND p.status = 'published'
      LEFT JOIN LATERAL (
        SELECT t.title
        FROM practice_translations t
        WHERE t.practice_id = p.id AND t.locale IN (${locale}, ${FALLBACK_LOCALE})
        ORDER BY (t.locale = ${locale}) DESC
        LIMIT 1
      ) pt ON TRUE
      WHERE th.pillar_key = ${pillar}
      GROUP BY th.id, th.sort_order, tt.title, tt.body_impact, tt.local_impact
      ORDER BY th.sort_order
    `);

    return (result.rows as ThemeRow[]).map((row) => ({
      key: row.key,
      title: row.title,
      bodyImpact: row.body_impact,
      localImpact: row.local_impact,
      practices: row.practices ?? [],
    }));
  }
}

function toCard(row: CatalogRow): PracticeCard {
  return {
    key: row.key,
    title: row.title,
    summary: row.summary,
    cue: row.cue,
    minimum: row.minimum,
    effortMinutes: row.effort_minutes,
    costLevel: row.cost_level,
    challengeKey: row.challenge_key,
    pillars: row.pillars as PillarKey[],
    studyCount: Number(row.study_count),
  };
}

/** Memorizado por petición, como `readPillarLocal` y `readPillarBibliography`. */
export const readPracticeCatalog = cache(async function readPracticeCatalog(
  locale: string,
): Promise<readonly PracticeCard[]> {
  return new PostgresPracticeCatalog().listPublished(locale);
});
