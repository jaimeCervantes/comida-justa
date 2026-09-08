import { sql } from "drizzle-orm";
import { cache } from "react";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import type { StudyCitation, StudyDesign } from "~/domain/practices/study";
import { db } from "~/infra/dataAccess/db/connection";
import type { PillarBibliographyRepository } from "~/use_cases/practices/ports/PillarBibliographyRepository";

/**
 * El idioma al que se cae cuando una práctica todavía no está traducida.
 *
 * Es el mismo reparto que `recommend_posts` hace con `locale`/`fallback_locale`: se prefiere el
 * idioma pedido y, si esa fila no existe, se enseña la española antes que dejar el hueco. Una
 * práctica sin nombre en la cita es peor que una práctica nombrada en el otro idioma.
 */
const FALLBACK_LOCALE = "es";

type BibliographyRow = {
  doi: string;
  title: string | null;
  journal: string | null;
  year: number | null;
  design: string | null;
  supports: string[] | null;
};

/**
 * La bibliografía de un pilar, con las prácticas que cada estudio sostiene.
 *
 * El orden lo manda `pillar_studies.sort_order`, que reproduce el de los arrays de `references.ts`:
 * agrupa por tema, y no es ni alfabético ni por año. Cambiarlo a «los más recientes primero» sonaría
 * a mejora y rompería la lectura, porque los estudios que se añadieron juntos explican lo mismo.
 *
 * `LEFT JOIN` en toda la cadena de prácticas a propósito: treinta de los cuarenta y tres estudios
 * del descanso no sostienen ninguna acción concreta —son el porqué del pilar, no el qué hacer— y
 * tienen que seguir apareciendo.
 */
export class PostgresPillarBibliography
  implements PillarBibliographyRepository
{
  async listByPillar(
    pillar: PillarKey,
    locale: string,
  ): Promise<readonly StudyCitation[]> {
    const result = await db.execute(sql`
      SELECT s.doi,
             s.title,
             s.journal,
             s.year,
             s.design,
             COALESCE(
               array_agg(DISTINCT t.title) FILTER (WHERE t.title IS NOT NULL),
               ARRAY[]::text[]
             ) AS supports
      FROM pillar_studies ps
      JOIN studies s ON s.id = ps.study_id
      LEFT JOIN practice_studies pcs ON pcs.study_id = s.id
      LEFT JOIN practices p ON p.id = pcs.practice_id AND p.status = 'published'
      LEFT JOIN LATERAL (
        SELECT pt.title
        FROM practice_translations pt
        WHERE pt.practice_id = p.id AND pt.locale IN (${locale}, ${FALLBACK_LOCALE})
        ORDER BY (pt.locale = ${locale}) DESC
        LIMIT 1
      ) t ON TRUE
      WHERE ps.pillar_key = ${pillar}
      GROUP BY s.id, ps.sort_order
      ORDER BY ps.sort_order
    `);

    return (result.rows as BibliographyRow[]).map(toCitation);
  }
}

function toCitation(row: BibliographyRow): StudyCitation {
  return {
    doi: row.doi,
    title: row.title,
    journal: row.journal,
    year: row.year,
    design: row.design as StudyDesign | null,
    supports: [...(row.supports ?? [])].sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Memorizada por petición como `readPillarLocal`: la sección la pide una sola página, pero el
 * artículo se arma en varias pasadas y no tiene sentido repetir la consulta en cada una.
 */
export const readPillarBibliography = cache(
  async function readPillarBibliography(
    pillar: PillarKey,
    locale: string,
  ): Promise<readonly StudyCitation[]> {
    return new PostgresPillarBibliography().listByPillar(pillar, locale);
  },
);
