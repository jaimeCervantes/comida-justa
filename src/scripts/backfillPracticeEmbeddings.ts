/**
 * Vectoriza las traducciones de las prácticas para que el bot pueda encontrarlas.
 *
 * **El mismo modelo que el catálogo, y no es una preferencia.** `gemini-embedding-001`, 768
 * dimensiones, exactamente igual que `post_translations` y que el chatbot. Dos modelos distintos
 * producen espacios distintos: la consulta no fallaría, devolvería vecinos absurdos, que es la peor
 * forma de romperse. Por eso se reutiliza `GeminiEmbeddingService` y no `VertexEmbeddingService`.
 *
 * Es **idempotente y reanudable**: sólo toca las filas sin vector, salvo con `--all`. Si Gemini se
 * cae a la mitad, lo hecho queda hecho y la siguiente corrida sigue donde se quedó.
 *
 * Uso: `pnpm run backfill:practice-embeddings [--dry-run] [--all] [--limit=N]`
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.development") });

const DEFAULT_LIMIT = 200;

type Options = { dryRun: boolean; all: boolean; limit: number };

function parseOptions(argv: string[]): Options {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : DEFAULT_LIMIT;
  return {
    dryRun: argv.includes("--dry-run"),
    all: argv.includes("--all"),
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
  };
}

type PendingRow = {
  id: string;
  practice_key: string;
  locale: string;
  title: string;
  summary: string;
  cue: string | null;
  how_to: string | null;
  minimum: string | null;
};

/**
 * El documento que se vectoriza.
 *
 * Lleva el ancla y el mínimo además del título y la promesa, porque quien escribe al bot describe
 * un **momento** —«no puedo dormir», «se me hace tarde y no he comido»— más a menudo que un tema. Un
 * vector que sólo conozca el título encuentra la práctica por su nombre, que es justo lo que quien
 * pregunta no sabe todavía.
 *
 * La advertencia se queda fuera a propósito: es idéntica dentro de un pilar, así que acercaría entre
 * sí a todas sus prácticas y emborronaría lo que las distingue.
 */
function embeddingText(row: PendingRow): string {
  return [row.title, row.summary, row.cue, row.minimum, row.how_to]
    .filter((part): part is string => Boolean(part))
    .join(". ");
}

function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: falta DATABASE_URL.");
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "ERROR: falta GEMINI_API_KEY (el mismo valor que usa el bot).",
    );
    process.exit(1);
  }

  const { db } = await import("~/infra/dataAccess/db/connection");
  const { default: GeminiEmbeddingService } = await import(
    "~/infra/services/GeminiEmbeddingService"
  );

  const pending = await db.execute(sql`
    SELECT t.id, p.key AS practice_key, t.locale, t.title, t.summary,
           t.cue, t.how_to, t.minimum
    FROM practice_translations t
    JOIN practices p ON p.id = t.practice_id
    WHERE p.status = 'published'
      AND (${options.all} OR t.embedding IS NULL)
    ORDER BY p.key, t.locale
    LIMIT ${options.limit}
  `);
  const rows = pending.rows as PendingRow[];

  console.log(`Traducciones por vectorizar: ${rows.length}`);
  if (options.dryRun) {
    for (const row of rows)
      console.log(`  ${row.practice_key} [${row.locale}]`);
    process.exit(0);
  }

  const service = new GeminiEmbeddingService({
    apiKey: process.env.GEMINI_API_KEY,
  });

  let done = 0;
  const failed: string[] = [];

  for (const row of rows) {
    try {
      const embedding = await service.generateEmbedding(embeddingText(row));
      await db.execute(sql`
        UPDATE practice_translations
        SET embedding = ${vectorLiteral(embedding)}::vector
        WHERE id = ${row.id}::uuid
      `);
      done++;
    } catch (error) {
      /* Una traducción que Gemini rechaza no detiene la corrida: se deja sin vector, la siguiente
         la vuelve a intentar, y mientras tanto el bot simplemente no la encuentra. Es degradar, no
         romper — la misma regla que sigue publicar una publicación. */
      failed.push(`${row.practice_key} [${row.locale}]: ${String(error)}`);
    }
  }

  const total = await db.execute(sql`
    SELECT COUNT(*) FILTER (WHERE embedding IS NOT NULL)::int AS con_vector,
           COUNT(*)::int                                      AS traducciones
    FROM practice_translations
  `);

  console.log(`Vectorizadas en esta corrida: ${done}`);
  if (failed.length > 0) {
    console.log(`Fallaron ${failed.length}:`);
    for (const line of failed) console.log(`  ${line}`);
  }
  console.log("Estado:", JSON.stringify(total.rows[0]));

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
