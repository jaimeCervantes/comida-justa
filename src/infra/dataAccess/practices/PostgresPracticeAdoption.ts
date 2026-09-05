import { sql } from "drizzle-orm";
import { cache } from "react";
import type {
  PracticeAdoption,
  PracticeSource,
} from "~/domain/practices/adoption";
import { db } from "~/infra/dataAccess/db/connection";
import type { PracticeAdoptionRepository } from "~/use_cases/practices/ports/PracticeAdoptionRepository";

type AdoptionRow = {
  practice_key: string;
  started_at: Date;
  stopped_at: Date | null;
  sharing_enabled: boolean;
  source: string;
};

export class PostgresPracticeAdoption implements PracticeAdoptionRepository {
  async listFor(userId: string): Promise<readonly PracticeAdoption[]> {
    const result = await db.execute(sql`
      SELECT p.key AS practice_key, up.started_at, up.stopped_at,
             up.sharing_enabled, up.source
      FROM user_practices up
      JOIN practices p ON p.id = up.practice_id
      WHERE up.user_id = ${userId}
      ORDER BY up.started_at DESC
    `);

    return (result.rows as AdoptionRow[]).map((row) => ({
      practiceKey: row.practice_key,
      startedAt: new Date(row.started_at),
      stoppedAt: row.stopped_at ? new Date(row.stopped_at) : null,
      sharingEnabled: row.sharing_enabled,
      source: row.source as PracticeSource,
    }));
  }

  /**
   * `ON CONFLICT DO UPDATE SET stopped_at = NULL`: volver reabre, no duplica ni reinicia.
   *
   * `started_at` **no** se toca en el conflicto a propósito. La primera vez que alguien empezó algo
   * es lo que este producto quiere recordar; sobrescribirla al volver borraría justo la historia que
   * su gamificación premia.
   *
   * El `SELECT … WHERE status = 'published'` es lo que impide inscribir a nadie en una práctica
   * retirada o en borrador aunque le manden la clave a mano: sin fila que seleccionar, no hay
   * `INSERT`, y `rowCount` en cero es lo que se devuelve como `false`.
   */
  async start(
    userId: string,
    practiceKey: string,
    source: PracticeSource,
  ): Promise<boolean> {
    const result = await db.execute(sql`
      INSERT INTO user_practices (user_id, practice_id, source)
      SELECT ${userId}, p.id, ${source}
      FROM practices p
      WHERE p.key = ${practiceKey} AND p.status = 'published'
      ON CONFLICT (user_id, practice_id) DO UPDATE
        SET stopped_at = NULL,
            source     = EXCLUDED.source
    `);
    return (result.rowCount ?? 0) > 0;
  }

  async stop(userId: string, practiceKey: string): Promise<void> {
    await db.execute(sql`
      UPDATE user_practices up
      SET stopped_at = now()
      FROM practices p
      WHERE p.id = up.practice_id
        AND up.user_id = ${userId}
        AND p.key = ${practiceKey}
        AND up.stopped_at IS NULL
    `);
  }
}

/** Memorizada por petición: el índice la consulta una vez y pregunta por ella 45 veces. */
export const readPracticeAdoptions = cache(async function readPracticeAdoptions(
  userId: string,
): Promise<readonly PracticeAdoption[]> {
  return new PostgresPracticeAdoption().listFor(userId);
});
