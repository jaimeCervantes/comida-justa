import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Comprueba que el sitio vectoriza en el MISMO espacio que el chatbot.
 *
 * Es la única forma de detectar el fallo más caro de esta feature: si el sitio usara otro modelo
 * (o compusiera el texto distinto), los vectores seguirían midiendo 768 y `search_posts_semantic`
 * seguiría devolviendo resultados — resultados sin sentido. Un índice envenenado no lanza
 * excepciones, así que hay que ir a buscarlo.
 *
 * El método: se toman publicaciones cuyo vector lo escribió el bot, se regenera su vector desde
 * el sitio y se comparan por similitud coseno. Cerca de 1 = mismo modelo y mismo texto.
 */

const SIMILARITY_FLOOR = 0.95;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function parseVector(raw: string): number[] {
  return raw
    .slice(1, -1)
    .split(",")
    .map((value) => Number(value));
}

async function verifyEmbeddingSpace(): Promise<void> {
  if (!process.env.DATABASE_URL || !process.env.GEMINI_API_KEY) {
    console.error("ERROR: DATABASE_URL y GEMINI_API_KEY son obligatorias.");
    process.exit(1);
  }

  const { sql } = await import("drizzle-orm");
  const { db } = await import("~/infra/dataAccess/db/connection");
  const { buildEmbeddingText } = await import("~/domain/entities/post/embedding");
  const { createPostEmbeddingRepository } = await import(
    "~/infra/dataAccess/indexPostEmbedding/factory"
  );
  const { createEmbeddingService } = await import("~/infra/services/factory");

  // Solo las que el bot ya había indexado: son las que definen el espacio de referencia.
  const raw = await db.execute(sql`
    SELECT t.post_id, t.locale, t.title, t.embedding::text AS embedding
    FROM post_translations t
    JOIN products pr ON pr.id::text = t.post_id
    WHERE t.embedding IS NOT NULL
    ORDER BY t.title
  `);

  const rows = raw.rows as unknown as Array<{
    post_id: string;
    locale: string;
    title: string;
    embedding: string;
  }>;

  if (rows.length === 0) {
    console.error("No hay traducciones indexadas por el bot contra las que comparar.");
    process.exit(1);
  }

  const repository = createPostEmbeddingRepository();
  const service = createEmbeddingService();
  const results: Array<{ title: string; similarity: number }> = [];

  for (const row of rows) {
    const source = await repository.findEmbeddingSource({
      postId: row.post_id,
      locale: row.locale,
    });

    if (!source) continue;

    const regenerated = await service.generateEmbedding(buildEmbeddingText(source));
    results.push({
      title: row.title,
      similarity: cosineSimilarity(parseVector(row.embedding), regenerated),
    });
  }

  console.table(
    results.map((result) => ({
      title: result.title,
      similarity: result.similarity.toFixed(4),
      ok: result.similarity >= SIMILARITY_FLOOR ? "sí" : "NO",
    })),
  );

  const worst = Math.min(...results.map((result) => result.similarity));
  const average =
    results.reduce((sum, result) => sum + result.similarity, 0) / results.length;

  console.log(`\nComparadas ${results.length} publicaciones.`);
  console.log(`Similitud media: ${average.toFixed(4)} — peor caso: ${worst.toFixed(4)}`);

  if (worst < SIMILARITY_FLOOR) {
    console.error(
      `\nFALLA: el peor caso baja de ${SIMILARITY_FLOOR}. El sitio y el bot no comparten espacio vectorial.`,
    );
    process.exit(1);
  }

  console.log("\nOK: el sitio vectoriza en el mismo espacio que el chatbot.");
}

verifyEmbeddingSpace()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
