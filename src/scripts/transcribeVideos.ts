import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.development") });

/**
 * Prepara la transcripción de las publicaciones en video, y la guarda cuando ya está revisada.
 *
 * **Por qué hace falta.** 8 de las 24 publicaciones son un `.mp4`. Su `content` cuenta de qué va el
 * video —y eso ya se aprovecha entero en la metadata y en el `VideoObject`—, pero **lo que se dice
 * dentro no existe como texto en ninguna parte**: ni un buscador ni un asistente pueden leerlo ni
 * citarlo.
 *
 * **Lo que hace y lo que no.** Hace todo el trabajo mecánico: buscar los videos, descargarlos,
 * sacarles el audio en el formato que quieren los modelos, y escribir el texto ya revisado. **No
 * llama a ningún servicio de transcripción**: ese paso lo corres tú con la herramienta y las
 * credenciales que prefieras, y de paso te obliga a leer el resultado antes de publicarlo, que es
 * justo lo que hay que hacer — Whisper se equivoca con los nombres propios y con los términos de
 * salud.
 *
 * ## Cómo se usa
 *
 * 1. `pnpm exec tsx src/scripts/transcribeVideos.ts`
 *    Lista los videos y dice cuáles ya tienen transcripción.
 *
 * 2. `pnpm exec tsx src/scripts/transcribeVideos.ts --fetch`
 *    Descarga cada video y deja su audio en `transcripciones/<slug>.wav` (16 kHz, mono, que es lo
 *    que piden los modelos de voz). Necesita `ffmpeg` en el PATH.
 *
 * 3. Transcribe cada `.wav` **con la herramienta que quieras**, y deja el texto en
 *    `transcripciones/<slug>.txt`. Por ejemplo, con Whisper local:
 *
 *    ```
 *    pip install -U openai-whisper
 *    whisper transcripciones/la-clave-para-dormir-profundo.wav \
 *      --model large-v3 --language Spanish --output_format txt \
 *      --output_dir transcripciones
 *    ```
 *
 *    También sirve pegar el audio en cualquier asistente que acepte voz. El formato del `.txt` es
 *    texto corrido en párrafos: **sin marcas de tiempo y sin nombres de quien habla**, que no
 *    aportan nada a un buscador y ensucian la lectura.
 *
 * 4. **Léelas y corrígelas.** Es el paso que no se salta.
 *
 * 5. `pnpm exec tsx src/scripts/transcribeVideos.ts --apply`
 *    Añade cada transcripción al final del `content` de su publicación, bajo un encabezado, con
 *    respaldo. Se deshace con `--restore=<archivo>`.
 *
 * **Dónde debería vivir esto a la larga:** en una columna propia (`post_translations.transcript`),
 * porque una transcripción no es la descripción y hay que poder distinguirlas —el `VideoObject`
 * tiene una propiedad `transcript` para eso—. Eso es una migración de Alembic en el backend Python;
 * mientras no exista, pegarla al final del contenido es lo que se puede hacer sin tocar el esquema,
 * y el texto queda igual de legible e indexable.
 */
import { Client } from "pg";

const WORK_DIR = "transcripciones";
const HEADING = "Transcripción del video:";

interface VideoRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  url: string;
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

async function readVideos(client: Client): Promise<VideoRow[]> {
  const { rows } = await client.query<VideoRow>(`
    SELECT t.id, t.slug, t.title, t.content, m.url
    FROM post_translations t
    JOIN post_media m ON m.post_id = t.post_id AND m.type = 'video'
    WHERE t.locale = 'es'
    ORDER BY t.slug
  `);

  return rows;
}

const audioPath = (slug: string): string =>
  resolve(process.cwd(), WORK_DIR, `${slug}.wav`);
const textPath = (slug: string): string =>
  resolve(process.cwd(), WORK_DIR, `${slug}.txt`);

/** ¿Ya está la transcripción pegada en el contenido? */
const isApplied = (row: VideoRow): boolean => row.content.includes(HEADING);

async function list(): Promise<void> {
  const client = connect();
  await client.connect();
  const videos = await readVideos(client);
  await client.end();

  console.log(`${videos.length} publicaciones en video:\n`);

  for (const video of videos) {
    const estado = isApplied(video)
      ? "ya publicada"
      : existsSync(textPath(video.slug))
        ? "transcrita, sin publicar"
        : existsSync(audioPath(video.slug))
          ? "audio listo, falta transcribir"
          : "sin empezar";

    console.log(`- ${video.slug}\n    ${video.title}\n    ${estado}`);
  }

  console.log(
    `\nSiguiente paso: --fetch para bajar el audio, o --apply si ya hay .txt revisados.`,
  );
}

function requireFfmpeg(): void {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    console.error(
      "ERROR: no encuentro `ffmpeg` en el PATH. Es lo que saca el audio del .mp4.",
    );
    process.exit(1);
  }
}

/**
 * Baja el video y le saca el audio en una sola pasada: `ffmpeg` lee la URL directamente, así que no
 * hace falta guardar el `.mp4` para tirarlo después.
 */
async function fetchAudio(): Promise<void> {
  requireFfmpeg();
  mkdirSync(resolve(process.cwd(), WORK_DIR), { recursive: true });

  const client = connect();
  await client.connect();
  const videos = await readVideos(client);
  await client.end();

  for (const video of videos) {
    const destino = audioPath(video.slug);

    if (existsSync(destino)) {
      console.log(`ya estaba: ${video.slug}.wav`);
      continue;
    }

    console.log(`bajando ${video.slug}…`);
    execFileSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        video.url,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        destino,
      ],
      { stdio: "inherit" },
    );
    console.log(`  audio en ${WORK_DIR}/${video.slug}.wav`);
  }

  console.log(
    `\nAhora transcribe cada .wav y deja el texto en ${WORK_DIR}/<slug>.txt (ver el encabezado de este archivo).`,
  );
}

async function apply(): Promise<void> {
  const client = connect();
  await client.connect();
  const videos = await readVideos(client);

  const pendientes = videos.filter(
    (video) => !isApplied(video) && existsSync(textPath(video.slug)),
  );

  if (pendientes.length === 0) {
    console.log("No hay ninguna transcripción nueva que publicar.");
    await client.end();
    return;
  }

  const backupFile = `transcripciones-backup-${Date.now()}.json`;
  writeFileSync(
    resolve(process.cwd(), backupFile),
    JSON.stringify(
      pendientes.map(
        (video): BackupEntry => ({
          id: video.id,
          slug: video.slug,
          content: video.content,
        }),
      ),
      null,
      2,
    ),
    "utf8",
  );
  console.log(`Respaldo en ${backupFile}\n`);

  for (const video of pendientes) {
    const transcript = readFileSync(textPath(video.slug), "utf8").trim();

    if (!transcript) {
      console.log(`vacía, se salta: ${video.slug}`);
      continue;
    }

    const content = `${video.content.trimEnd()}\n\n${HEADING}\n\n${transcript}\n`;

    await client.query(
      "UPDATE post_translations SET content = $1 WHERE id = $2",
      [content, video.id],
    );
    console.log(
      `publicada ${video.slug}: ${video.content.length} → ${content.length} caracteres`,
    );
  }

  console.log(`\nPara deshacer: --restore=${backupFile}`);
  console.log(
    "Ojo: el `embedding` de estas traducciones se calculó con el texto anterior. Re-indexarlas " +
      "exige ponerlo en NULL y correr `pnpm run backfill-embeddings`; entre esos dos pasos el " +
      "chatbot no las ve.",
  );
  await client.end();
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

async function main(): Promise<void> {
  const restoreArg = process.argv.find((arg) => arg.startsWith("--restore="));

  if (restoreArg) return restore(restoreArg.split("=")[1]);
  if (process.argv.includes("--fetch")) return fetchAudio();
  if (process.argv.includes("--apply")) return apply();

  return list();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
