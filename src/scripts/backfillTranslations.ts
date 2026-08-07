import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Slice 3 de `docs/features/i18n.md`: traduce lo que ya estaba publicado.
 *
 * Las 24 publicaciones existentes nacieron solo en español, así que `/en/<slug>` sirve el texto
 * español con el marco en inglés. Este script es el que vuelve honesto ese prefijo.
 *
 * Es **idempotente**: `saveTranslation` inserta con `WHERE NOT EXISTS`, así que correrlo dos veces
 * no duplica ni pisa una traducción corregida a mano. Importa porque `post_translations` no tiene
 * `UNIQUE(post_id, locale)` (ver la nota del mismo documento).
 *
 * Deja la fila **sin embedding a propósito**: el vector vive por traducción, y generarlo es trabajo
 * de `pnpm run backfill-embeddings`, que ya sabe encontrar traducciones sin indexar. Encadenar las
 * dos cosas aquí duplicaría esa lógica y haría el script el doble de frágil.
 *
 * Modos: `--dry-run` (solo lista), `--limit=N` (por defecto 50) y `--target=<locale>`.
 *
 * Para deshacer una corrida:
 *   DELETE FROM post_translations WHERE locale = 'en';
 */

type Options = {
  dryRun: boolean;
  limit: number;
  sourceLocale: string;
  targetLocale: string;
};

const DEFAULT_LIMIT = 50;
const DEFAULT_SOURCE = "es";
const DEFAULT_TARGET = "en";

function readArg(argv: string[], name: string): string | undefined {
  return argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
}

function parseOptions(argv: string[]): Options {
  const limit = Number(readArg(argv, "limit") ?? DEFAULT_LIMIT);

  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
    sourceLocale: readArg(argv, "source") ?? DEFAULT_SOURCE,
    targetLocale: readArg(argv, "target") ?? DEFAULT_TARGET,
  };
}

async function backfillTranslations(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing.");
    process.exit(1);
  }

  const { createPostTranslationRepository, createTranslatePostUseCase } =
    await import("~/infra/dataAccess/translatePost/factory");

  const pending =
    await createPostTranslationRepository().findPostsMissingLocale(
      options.sourceLocale,
      options.targetLocale,
      options.limit,
    );

  if (options.dryRun) {
    console.log("DRY RUN — no se escribe nada en la base de datos.\n");
    console.table(
      pending.map((row) => ({
        postId: row.postId,
        slug: row.slug,
        title: row.title.slice(0, 50),
      })),
    );
    console.log(
      `\n${pending.length} publicaciones sin '${options.targetLocale}'.`,
    );
    return;
  }

  console.log(
    `Traduciendo ${pending.length} publicaciones de '${options.sourceLocale}' a '${options.targetLocale}'...\n`,
  );

  let translated = 0;
  let skipped = 0;
  let failed = 0;
  const useCase = createTranslatePostUseCase();

  for (const row of pending) {
    const result = await useCase.execute({
      postId: row.postId,
      sourceLocale: options.sourceLocale,
      targetLocale: options.targetLocale,
    });

    if (result.translated) {
      translated += 1;
      console.log(`  ✓ ${row.slug} → ${result.slug}`);
      continue;
    }

    if (result.reason === "provider-failed") {
      failed += 1;
      console.warn(`  ✗ ${row.slug}: ${String(result.error)}`);
      continue;
    }

    skipped += 1;
    console.log(`  – ${row.slug}: ${result.reason}`);
  }

  console.log("------------------------------------------------");
  console.log(`Traducidas: ${translated}`);
  console.log(`Omitidas:   ${skipped}`);
  console.log(`Fallidas:   ${failed}`);

  if (translated > 0) {
    console.log(
      "\nLas filas nuevas están SIN embedding. Corre `pnpm run backfill-embeddings`",
    );
    console.log("o el chatbot no las encontrará al buscar en inglés.");
  }

  if (failed > 0) {
    console.log("Las fallidas siguen pendientes; vuelve a correr el script.");
  }
}

backfillTranslations()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
