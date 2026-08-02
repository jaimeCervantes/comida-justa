import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Saca de `post_translations.content` la ristra de hashtags con la que cierran las publicaciones
 * que nacieron como reels.
 *
 * **Por qué no van a la columna `tags`:** `tags` alimenta el vector del chatbot
 * (`buildEmbeddingText` escribe "Etiquetas: agua, avena, canela") y hoy guarda **ingredientes**.
 * Meter ahí 24 hashtags promocionales —"BuenSueño", "DormirBien", "RegálateSueño"— secuestraría el
 * embedding de esa publicación: el chatbot dejaría de encontrarla por lo que es y empezaría a
 * encontrarla por su campaña.
 *
 * **Es reversible:** antes de escribir, vuelca el contenido original de cada fila a un JSON, y con
 * ese archivo se restaura tal cual (`--restore=<archivo>`).
 *
 * Modos:
 *   `pnpm tsx src/scripts/stripContentHashtags.ts`                 → solo enseña qué cambiaría
 *   `pnpm tsx src/scripts/stripContentHashtags.ts --apply`         → escribe, con respaldo
 *   `pnpm tsx src/scripts/stripContentHashtags.ts --restore=x.json` → deshace
 */
import { Client } from "pg";
import { splitHashtags } from "~/domain/entities/post/hashtags";

interface Row {
  id: string;
  slug: string;
  content: string;
}

interface BackupEntry {
  id: string;
  slug: string;
  content: string;
}

function connect(): Client {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: falta DATABASE_URL.");
    process.exit(1);
  }

  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

async function restore(file: string): Promise<void> {
  const backup = JSON.parse(
    readFileSync(resolve(process.cwd(), file), "utf8"),
  ) as BackupEntry[];
  const client = connect();
  await client.connect();

  for (const entry of backup) {
    await client.query(
      "UPDATE post_translations SET content = $1 WHERE id = $2",
      [entry.content, entry.id],
    );
    console.log(`restaurado ${entry.slug}`);
  }

  await client.end();
}

async function strip(apply: boolean): Promise<void> {
  const client = connect();
  await client.connect();

  const { rows } = await client.query<Row>(
    "SELECT id, slug, content FROM post_translations WHERE content LIKE '%#%' ORDER BY slug",
  );

  const affected = rows
    .map((row) => ({ row, split: splitHashtags(row.content) }))
    .filter(({ split }) => split.hashtags.length > 0);

  if (affected.length === 0) {
    console.log("No hay ninguna publicación que cierre con hashtags.");
    await client.end();
    return;
  }

  for (const { row, split } of affected) {
    console.log(
      `${row.slug}: ${row.content.length} → ${split.body.length} caracteres  (${split.hashtags.length} etiquetas)`,
    );
    console.log(`  quita: ${split.hashtags.map((tag) => `#${tag}`).join(" ")}`);
  }

  if (!apply) {
    console.log(`\nEnsayo. Con --apply se escriben ${affected.length} filas.`);
    await client.end();
    return;
  }

  const backupFile = `hashtags-backup-${Date.now()}.json`;
  writeFileSync(
    resolve(process.cwd(), backupFile),
    JSON.stringify(
      affected.map(({ row }) => ({
        id: row.id,
        slug: row.slug,
        content: row.content,
      })),
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\nRespaldo escrito en ${backupFile}`);

  for (const { row, split } of affected) {
    await client.query(
      "UPDATE post_translations SET content = $1 WHERE id = $2",
      [split.body, row.id],
    );
    console.log(`limpiado ${row.slug}`);
  }

  console.log(
    `\nListo: ${affected.length} filas. Para deshacer: --restore=${backupFile}`,
  );
  await client.end();
}

async function main(): Promise<void> {
  const restoreArg = process.argv.find((arg) => arg.startsWith("--restore="));

  if (restoreArg) {
    await restore(restoreArg.split("=")[1]);
    return;
  }

  await strip(process.argv.includes("--apply"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
