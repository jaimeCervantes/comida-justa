/**
 * Prepara la narración para la mezcla y mide el guion con ella.
 *
 *   node scripts/animations/prepare-narration.mjs [--origen=out/narration] [--salida=out/narration]
 *        [--idiomas=es,en] [--tempo=1.07]
 *
 * Toma las pistas crudas de `generate-narration.mjs` (`<origen>/<idioma>/<escena>.b<n>.wav`), les
 * quita el silencio del principio y del final, las acelera un poco y las deja en
 * `<salida>/<idioma>-final/`, que es de donde las toma la mezcla de `render-video.mjs`. El tempo:
 * el narrador sintético lee pausado, y un 7 % más rápido suena natural sin cambiar el tono.
 *
 * Después imprime cuánto debe durar cada subtítulo: lo que tarda el narrador en el idioma más lento,
 * más 0,35 s de entrada (el subtítulo empieza a escribirse antes que la voz) y 0,65 s de respiro,
 * redondeado hacia arriba a cuartos de segundo. Esos números van en `pillarsOverviewScript.ts`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

const sourceDir = options.origen ?? "out/narration";
const outDir = options.salida ?? sourceDir;
const locales = (options.idiomas ?? "es,en").split(",");
const tempo = Number(options.tempo ?? 1.07);
const LEAD_SEC = 0.35;
const BREATH_SEC = 0.65;

const TRIM =
  "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse";

function secondsOf(file) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number(probe.stdout.trim());
}

/** La duración de cada frase, por clave (`sleep.b2`) y por idioma. */
const takes = new Map();
for (const locale of locales) {
  const from = path.join(sourceDir, locale);
  const to = path.join(outDir, `${locale}-final`);
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs
    .readdirSync(from)
    .filter((file) => /\.b\d\.wav$/.test(file))) {
    const target = path.join(to, name);
    const result = spawnSync(
      "ffmpeg",
      [
        "-v",
        "error",
        "-y",
        "-i",
        path.join(from, name),
        "-af",
        `${TRIM},atempo=${tempo}`,
        target,
      ],
      { encoding: "utf8" },
    );
    if (result.status !== 0) throw new Error(`${name}: ${result.stderr}`);
    const key = name.replace(/\.wav$/, "");
    takes.set(key, { ...takes.get(key), [locale]: secondsOf(target) });
  }
}

/** Las escenas en el orden en que aparecen, y en cada una sus subtítulos en orden. */
const scenes = new Map();
for (const [key, byLocale] of takes) {
  const [scene, beat] = key.split(".");
  const slowest = Math.max(...Object.values(byLocale));
  const ms = (Math.ceil((slowest + LEAD_SEC + BREATH_SEC) * 4) / 4) * 1000;
  scenes.set(scene, [...(scenes.get(scene) ?? []), { beat, ms, byLocale }]);
}
let totalMs = 0;
for (const [scene, beats] of scenes) {
  beats.sort((a, b) => a.beat.localeCompare(b.beat));
  for (const { beat, ms, byLocale } of beats) {
    const detail = Object.entries(byLocale)
      .map(([locale, seconds]) => `${locale} ${seconds.toFixed(2)} s`)
      .join(", ");
    console.log(`${scene}.${beat}: ${detail} → ${ms} ms`);
    totalMs += ms;
  }
  console.log(
    `  { id: "${scene}", beatDurationsMs: [${beats.map(({ ms }) => ms).join(", ")}] }`,
  );
}
console.log(`Total: ${(totalMs / 1000).toFixed(2)} s`);
