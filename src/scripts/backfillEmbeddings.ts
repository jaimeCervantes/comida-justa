import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Slice 4 de `docs/features/catalogo-unificado.md`: indexa lo que quedó sin vector.
 *
 * Dos poblaciones caen aquí: las publicaciones anteriores a este slice (que nacieron sin
 * embedding y por eso el chatbot no las ve) y las que se crearon mientras Gemini estaba caído
 * —publicar nunca falla por el proveedor, se deja pendiente y se reintenta desde acá—.
 *
 * Modos: `--dry-run` (solo lista lo pendiente) y `--limit=N` (por defecto 200).
 */

type Options = {
  dryRun: boolean;
  limit: number;
};

const DEFAULT_LIMIT = 200;

function parseOptions(argv: string[]): Options {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : DEFAULT_LIMIT;

  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
  };
}

async function backfillEmbeddings(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing (mismo valor que usa el bot).");
    process.exit(1);
  }

  const {
    createBackfillPostEmbeddingsUseCase,
    createPostEmbeddingRepository,
  } = await import("~/infra/dataAccess/indexPostEmbedding/factory");

  if (options.dryRun) {
    const pending = await createPostEmbeddingRepository().findPendingIndexing(
      options.limit,
    );

    console.log("DRY RUN — no se escribe nada en la base de datos.\n");
    console.table(pending);
    console.log(`\n${pending.length} traducciones pendientes de indexar.`);
    return;
  }

  console.log(`Indexando hasta ${options.limit} traducciones pendientes...`);

  const summary = await createBackfillPostEmbeddingsUseCase().execute(options.limit);

  console.log("------------------------------------------------");
  console.log(`Intentadas: ${summary.attempted}`);
  console.log(`Indexadas:  ${summary.indexed}`);
  console.log(`Fallidas:   ${summary.failed}`);

  if (summary.failed > 0) {
    console.log("Motivos:", summary.reasons);
    console.log("Las fallidas siguen pendientes; vuelve a correr el script.");
  }
}

backfillEmbeddings()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
