/**
 * Exporta la animación de los cuatro pilares a video, cuadro por cuadro.
 *
 *   node scripts/animations/render-video.mjs --pieza=sueno --formato=vertical [--idioma=es]
 *        [--base=http://localhost:3000] [--fps=30] [--salida=out/videos/…mp4]
 *
 * Necesita un `next dev` ya levantado en `--base` (no lo levanta: dos servidores sobre la misma
 * `.next` se estropean). Abre `/animaciones/video`, que solo existe en desarrollo, la lleva a cada
 * instante con `window.__renderFrame(ms)` y le pasa la captura a `ffmpeg`, que la codifica en H.264
 * (`yuv420p`, `+faststart`): lo que aceptan Instagram, TikTok, YouTube y WhatsApp.
 *
 * Piezas: completo, sueno, alimentacion, movimiento, mente. Formatos: vertical (1080×1920),
 * cuadrado (1080×1080), horizontal (1920×1080). El video sale sin sonido; la música se mezcla
 * aparte.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
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
const base = options.base ?? "http://localhost:3000";
const cut = options.pieza ?? "completo";
const format = options.formato ?? "vertical";
const locale = options.idioma ?? "es";
const fps = Number(options.fps ?? 30);
const size = SIZES[format];
if (!size) throw new Error(`Formato desconocido: ${format}`);
const [width, height] = size;
const output = options.salida ?? `out/videos/${cut}-${format}-${locale}.mp4`;
fs.mkdirSync(path.dirname(output), { recursive: true });

const prefix = locale === "es" ? "" : `/${locale}`;
const url = `${base}${prefix}/animaciones/video?pieza=${cut}&formato=${format}`;

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
  {
    timeout: 120_000,
  },
);
const durationMs = await page.evaluate(() => window.__renderInfo.durationMs);
const frames = Math.ceil((durationMs / 1000) * fps);

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
    "-movflags",
    "+faststart",
    output,
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
await browser.close();
console.log(
  `${output} · ${frames} cuadros · ${(durationMs / 1000).toFixed(1)} s`,
);
