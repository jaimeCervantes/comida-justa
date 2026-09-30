/**
 * Exporta la animación de los cuatro pilares a video, cuadro por cuadro, con su sonido.
 *
 *   node scripts/animations/render-video.mjs --pieza=sueno --formato=vertical [--idioma=es]
 *        [--animacion=pilares] [--base=http://localhost:3000] [--fps=30] [--salida=out/videos/…mp4]
 *        [--narracion=out/narration/pilares/es-final] [--musica=out/music/calida-170s.mp3]
 *
 *   node scripts/animations/render-video.mjs --solo-sonido [--animacion=sueno] [--idioma=es]
 *   node scripts/animations/render-video.mjs --resonorizar --pieza=sueno --formato=vertical
 *
 * Necesita un `next dev` ya levantado en `--base` (no lo levanta: dos servidores sobre la misma
 * `.next` se estropean). Abre `/animaciones/video`, que solo existe en desarrollo, la lleva a cada
 * instante con `window.__renderFrame(ms)` y le pasa la captura a `ffmpeg`, que la codifica en H.264
 * (`yuv420p`, `+faststart`) con el sonido en AAC: lo que aceptan Instagram, TikTok, YouTube y
 * WhatsApp.
 *
 * `--animacion` es `pilares` (la de los cuatro, por omisión) o la de un pilar, como `sueno`. Piezas
 * de la de los cuatro: completo, sueno, alimentacion, movimiento, mente; las de cada pilar solo
 * salen completas. Formatos: vertical (1080×1920), cuadrado (1080×1080), horizontal (1920×1080).
 *
 * El sonido es la narración de cada subtítulo en su momento (`<escena>.b<n>.wav`, de
 * `generate-narration.mjs`) con la música debajo (de `generate-music.mjs`), que baja sola mientras
 * habla el narrador. `--solo-sonido` escribe solo la pista de la animación completa, la que suena
 * en la web (`public/animations/pilares/sonido-<idioma>.mp3`, o `sonido-sueno-<idioma>.mp3` para
 * la de Sueño); `--resonorizar` le cambia el sonido a un video ya exportado sin volver a grabar sus
 * cuadros.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

const SIZES = {
  vertical: [1080, 1920],
  cuadrado: [1080, 1080],
  horizontal: [1920, 1080],
};
/** La música de cada animación, de `generate-music.mjs`. */
const MUSIC = {
  pilares: "out/music/calida-170s.mp3",
  sueno: "out/music/nocturna-150s.mp3",
};

const base = options.base ?? "http://localhost:3000";
const soundOnly = "solo-sonido" in options;
const resound = "resonorizar" in options;
const animation = options.animacion ?? "pilares";
const overview = animation === "pilares";
const cut = soundOnly ? "completo" : (options.pieza ?? "completo");
const format = options.formato ?? "vertical";
const locale = options.idioma ?? "es";
const fps = Number(options.fps ?? 30);
const narrationDir =
  options.narracion ?? `out/narration/${animation}/${locale}-final`;
const music = options.musica ?? MUSIC[animation];
if (!music) throw new Error(`Sin música para «${animation}»: usa --musica`);
const size = SIZES[format];
if (!size) throw new Error(`Formato desconocido: ${format}`);
const [width, height] = size;
const output =
  options.salida ??
  (soundOnly
    ? `public/animations/pilares/sonido-${overview ? "" : `${animation}-`}${locale}.mp3`
    : overview
      ? `out/videos/${cut}-${format}-${locale}.mp4`
      : `out/videos/pilar-${animation}-${format}-${locale}.mp4`);
fs.mkdirSync(path.dirname(output), { recursive: true });

/** El subtítulo empieza a escribirse antes que la voz: el mismo margen con el que se midió el guion. */
const VOICE_LEAD_MS = 350;
/** La música llega de Lyria ya masterizada (≈ −12 LUFS); debajo de la voz va mucho más baja. */
const MUSIC_GAIN_DB = -14;
/** La sonoridad de entrega: la que usan las redes y la web para contenido hablado. */
const TARGET_LUFS = -16;
/** El techo de los picos (≈ −2,5 dBFS), con margen para lo que suben al codificar en AAC o MP3. */
const PEAK_LIMIT = 0.75;
/**
 * Cuánto y cómo se agacha la música cuando habla el narrador. La recuperación es lenta a propósito:
 * con 0,45 s la música subía en cada coma y se oía bombear; con 1,2 s solo respira en las pausas
 * largas y entre escenas. Medido en la escena de Sueño: la música queda ~15 dB debajo de la voz.
 */
const DUCKING = "threshold=0.02:ratio=4:attack=20:release=1200";

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-y", ...args], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let log = "";
    child.stderr.on("data", (chunk) => {
      log += chunk;
    });
    child.on("close", (code) =>
      code === 0
        ? resolve(log)
        : reject(new Error(`ffmpeg terminó con ${code}\n${log.slice(-3000)}`)),
    );
  });
}

function secondsOf(file) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number(probe.stdout.trim());
}

/** Mide la sonoridad de lo que sale de `[mix]` con `loudnorm`, sin escribir nada. */
async function loudnessOf(inputs, graph) {
  const log = await runFfmpeg([
    ...inputs,
    "-filter_complex",
    `${graph};[mix]loudnorm=print_format=json[out]`,
    "-map",
    "[out]",
    "-f",
    "null",
    "-",
  ]);
  const report = JSON.parse(
    log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1),
  );
  return { lufs: Number(report.input_i), peak: Number(report.input_tp) };
}

/**
 * Mezcla el sonido de una pieza en un WAV: cada narración en su subtítulo y la música debajo, que
 * se agacha (compresión con la voz como llave) mientras habla el narrador y vuelve a subir en las
 * pausas. El final de la música cae en el final de la animación completa, y cada corte toma su
 * ventana de ahí: el corte de Sueño suena igual que Sueño dentro de la pieza entera.
 *
 * La sonoridad se ajusta en dos pasadas: se mide la mezcla y se le aplica una sola ganancia, con un
 * limitador que solo toca los picos. (`loudnorm` en una pasada, o en dos cuando la ganancia lineal
 * no cabe bajo el techo de pico, comprime la dinámica sobre la marcha y se nota en la voz.)
 */
async function mixSound(info, file) {
  const voices = info.beats.map((beat) => ({
    ...beat,
    file: path.join(narrationDir, `${beat.key}.wav`),
  }));
  const missing = voices.filter((voice) => !fs.existsSync(voice.file));
  if (missing.length > 0) {
    throw new Error(
      `Falta la narración de ${missing.map((voice) => voice.key).join(", ")} en ${narrationDir}`,
    );
  }
  const musicSec = secondsOf(music);
  const wholeSec = info.wholeMs / 1000;
  if (!(musicSec >= wholeSec)) {
    throw new Error(
      `${music} dura ${musicSec.toFixed(1)} s y la animación completa ${wholeSec} s: genera una más larga con generate-music.mjs --duracion`,
    );
  }
  const durationSec = info.durationMs / 1000;
  const musicFromSec = musicSec - wholeSec + info.fromMs / 1000;
  const fadeOutSec = Math.min(3, durationSec / 4);

  const graph = [
    `[0:a]atrim=start=${musicFromSec.toFixed(3)}:duration=${durationSec},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=${MUSIC_GAIN_DB}dB,afade=t=in:d=1.5,afade=t=out:st=${(durationSec - fadeOutSec).toFixed(3)}:d=${fadeOutSec}[bed]`,
    ...voices.map(
      (voice, index) =>
        `[${index + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${voice.startMs + VOICE_LEAD_MS}:all=1[v${index}]`,
    ),
    `${voices.map((_, index) => `[v${index}]`).join("")}amix=inputs=${voices.length}:normalize=0:duration=longest,apad=whole_dur=${durationSec}[voice]`,
    "[voice]asplit=2[key][lead]",
    `[bed][key]sidechaincompress=${DUCKING}[ducked]`,
    `[ducked][lead]amix=inputs=2:normalize=0:duration=first,atrim=duration=${durationSec}[mix]`,
  ].join(";");
  const inputs = [
    "-i",
    music,
    ...voices.flatMap((voice) => ["-i", voice.file]),
  ];

  const measured = await loudnessOf(inputs, graph);
  const gainDb = TARGET_LUFS - measured.lufs;
  await runFfmpeg([
    ...inputs,
    "-filter_complex",
    `${graph};[mix]volume=${gainDb.toFixed(2)}dB,alimiter=limit=${PEAK_LIMIT}:level=0:attack=5:release=60[out]`,
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    file,
  ]);
  const result = await loudnessOf(["-i", file], "[0:a]anull[mix]");
  console.log(
    `sonido: ${voices.length} frases, música desde ${musicFromSec.toFixed(1)} s, ${result.lufs} LUFS, pico ${result.peak} dBTP`,
  );
}

/** Abre la composición de la pieza y espera a que esté lista para grabar. */
async function openComposition() {
  const prefix = locale === "es" ? "" : `/${locale}`;
  const url = `${base}${prefix}/animaciones/video?animacion=${animation}&pieza=${cut}&formato=${format}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  /* Que no asome la invitación de la primera visita, ni el indicador de desarrollo de Next. */
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "pillarAnimations.seen.pillars-overview-invite",
      "1",
    );
  });
  await page.goto(url, { waitUntil: "load", timeout: 300_000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForFunction(
    () => typeof window.__renderFrame === "function",
    null,
    { timeout: 120_000 },
  );
  const info = await page.evaluate(() => window.__renderInfo);
  return { browser, page, info };
}

/** Graba los cuadros de la pieza en un video mudo. */
async function recordFrames(page, info, file) {
  const frames = Math.ceil((info.durationMs / 1000) * fps);
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-c:v",
      "mjpeg",
      "-i",
      "-",
      /* Las capturas JPEG vienen en rango completo; los reproductores y las redes esperan el rango
         estándar de video, y sin convertir los negros se ven lavados en algunos. */
      "-vf",
      "scale=in_range=pc:out_range=tv,format=yuv420p",
      "-color_range",
      "tv",
      "-c:v",
      "libx264",
      "-crf",
      "18",
      "-preset",
      "medium",
      file,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const finished = new Promise((resolve, reject) => {
    ffmpeg.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg terminó con ${code}`)),
    );
  });

  const started = Date.now();
  for (let frame = 0; frame < frames; frame++) {
    await page.evaluate((ms) => window.__renderFrame(ms), (frame * 1000) / fps);
    const shot = await page.screenshot({
      type: "jpeg",
      quality: 92,
      clip: { x: 0, y: 0, width, height },
    });
    if (!ffmpeg.stdin.write(shot)) {
      await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
    }
    if (frame % (fps * 5) === 0) {
      const seconds = Math.round((Date.now() - started) / 1000);
      console.log(
        `${cut} ${format}: ${Math.round((frame / frames) * 100)} % (${seconds} s)`,
      );
    }
  }
  ffmpeg.stdin.end();
  await finished;
  return frames;
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "render-video-"));
const sound = path.join(work, "sonido.wav");
const { browser, page, info } = await openComposition();
try {
  await mixSound(info, sound);
  if (soundOnly) {
    await runFfmpeg([
      "-i",
      sound,
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      output,
    ]);
    console.log(`${output} · ${(info.durationMs / 1000).toFixed(1)} s`);
  } else {
    let frames = null;
    let video = output;
    if (!resound) {
      video = path.join(work, "mudo.mp4");
      frames = await recordFrames(page, info, video);
    } else if (!fs.existsSync(output)) {
      throw new Error(`No hay video que resonorizar en ${output}`);
    }
    const target = path.join(work, "final.mp4");
    await runFfmpeg([
      "-i",
      video,
      "-i",
      sound,
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      target,
    ]);
    fs.copyFileSync(target, output);
    console.log(
      `${output}${frames ? ` · ${frames} cuadros` : ""} · ${(info.durationMs / 1000).toFixed(1)} s`,
    );
  }
} finally {
  await browser.close();
  fs.rmSync(work, { recursive: true, force: true });
}
