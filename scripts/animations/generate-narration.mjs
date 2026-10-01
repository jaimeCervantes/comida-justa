/**
 * Genera la locución de la animación con Gemini TTS.
 *
 *   node scripts/animations/generate-narration.mjs --voz=Charon --salida=<carpeta> [--idioma=es]
 *        [--seccion=overview] [--catalogo=<borrador.json>] [--por-escena]
 *        [--claves=intro.b1,intro.b2] [--texto="…"]
 *
 * Una pista por subtítulo (`<escena>.<subtítulo>.wav`), leída del catálogo de traducción sin las
 * marcas `<hl>`. `--seccion` es la animación dentro de `pillarAnimations`: `overview` (la de los
 * cuatro pilares, por omisión) o la de un pilar, como `sleep`. `--catalogo=<archivo.json>` lee los
 * textos de un borrador (`{ "es": {…}, "en": {…} }`, con la forma de la sección) en vez del
 * catálogo: sirve para narrar y medir un guion antes de llevarlo a la app. Con `--texto` genera una
 * sola muestra con ese texto: sirve para elegir la voz.
 *
 * `--por-escena` narra cada escena entera en un solo pedido y la corta en sus pausas más largas:
 * la cuota de Gemini 2.5 Pro TTS es de 50 pedidos al día, y una animación de pilar son 26 frases
 * entre los dos idiomas. Si una escena no se deja cortar en tantas frases como tiene, esa escena se
 * narra frase por frase.
 *
 * Usa `GEMINI_API_KEY` (del entorno o de `.env.development`); tiene costo, pequeño.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

const MODEL = options.modelo ?? "gemini-2.5-pro-preview-tts";
const voice = options.voz ?? "Charon";
const locale = options.idioma ?? "es";
const outDir = options.salida ?? `out/narration/${voice}-${locale}`;
fs.mkdirSync(outDir, { recursive: true });

/**
 * La dirección de la locución: la misma para cada frase, para que la voz no cambie de tono entre
 * una y otra. Va delante del texto con la forma «Say …:», que Gemini 2.5 Pro TTS interpreta como
 * dirección y no lee. (Gemini 3.8 Flash TTS la leía en voz alta y no acepta instrucción de
 * sistema; por eso el modelo por omisión es el 2.5 Pro.) Gemini 2.5 Flash TTS
 * (`--modelo=gemini-2.5-flash-preview-tts`) sí la entiende, y tiene su propia cuota: con él se
 * narraron Alimentación, Movimiento y Mente y espíritu cuando la de Pro se agotó. Una animación se
 * narra entera con un solo modelo, para que la voz suene pareja.
 *
 * El acento sale latinoamericano neutro, el de muchos locutores en México: pedir «acento mexicano»
 * no lo vuelve más regional.
 */
const DIRECTION = {
  es: "Say in a deep, warm, close male voice with a natural Mexican Spanish accent, like the narrator of a hopeful documentary, at a calm but not slow pace",
  en: "Say in a deep, warm, close male voice, like the narrator of a hopeful documentary, at a calm but not slow pace",
}[locale];

/** Por escena, la misma dirección y una pausa larga entre párrafo y párrafo: ahí se corta. */
const SCENE_DIRECTION = `${DIRECTION}, leaving a pause of about two seconds between paragraphs:`;

function readKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const line = fs
    .readFileSync(".env.development", "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("GEMINI_API_KEY="));
  return line
    ?.slice("GEMINI_API_KEY=".length)
    .replace(/^["']|["']$/g, "")
    .trim();
}

/** Gemini TTS devuelve PCM de 16 bits, mono, a 24 kHz: se envuelve en un WAV. */
function wav(pcm, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function speak(text, direction = `${DIRECTION}:`, attempt = 1) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": readKey(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${direction} ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      }),
    },
  );
  const json = await response.json();
  if (json.error) {
    /* El límite por minuto (Flash TTS: 10 pedidos) dice cuánto esperar: se espera y se vuelve a
       pedir. El diario no: ese corta la corrida. */
    const wait = json.error.message.match(/retry in ([\d.]+)s/);
    if (wait && !/per_day/.test(json.error.message) && attempt < 6) {
      await new Promise((resolve) =>
        setTimeout(resolve, (Number(wait[1]) + 1) * 1000),
      );
      return speak(text, direction, attempt + 1);
    }
    throw new Error(json.error.message);
  }
  const audio = json.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );
  if (!audio) throw new Error("La respuesta no trae audio");
  return wav(Buffer.from(audio.inlineData.data, "base64"));
}

/** Los silencios de una pista, en segundos, como los ve `silencedetect`. */
function silencesOf(file) {
  const probe = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-nostats",
      "-i",
      file,
      "-af",
      "silencedetect=noise=-40dB:d=0.25",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  const silences = [];
  let start = null;
  for (const line of probe.stderr.split(/\r?\n/)) {
    const opened = line.match(/silence_start: ([\d.]+)/);
    if (opened) start = Number(opened[1]);
    const closed = line.match(/silence_end: ([\d.]+)/);
    if (closed && start !== null) {
      silences.push({ start, end: Number(closed[1]) });
      start = null;
    }
  }
  if (start !== null) silences.push({ start, end: secondsOf(file) });
  return silences;
}

function secondsOf(file) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number(probe.stdout.trim());
}

/** Cuánta voz trae una toma por letra de su texto y su pausa más larga a media frase, en segundos. */
function measureTake(file, text) {
  const total = secondsOf(file);
  const silences = silencesOf(file);
  const silent = silences.reduce(
    (sum, silence) => sum + silence.end - silence.start,
    0,
  );
  const inner = silences.filter(
    (silence) => silence.start > 0.05 && silence.end < total - 0.05,
  );
  return {
    rate: (total - silent) / text.length,
    pause: Math.max(0, ...inner.map((silence) => silence.end - silence.start)),
  };
}

/**
 * Qué tan lejos está una toma de sonar bien: 0 si habla entre 0,055 y 0,12 s por letra (el
 * narrador anda por 0,075) y no se calla más de 1,2 s a media frase. Gemini 2.5 Flash TTS a veces
 * devuelve minutos de audio por una frase, una pista muda o una pausa larga en medio.
 */
function flawOf({ rate, pause }) {
  const off =
    rate < 0.055
      ? Math.log(0.055 / rate)
      : rate > 0.12
        ? Math.log(rate / 0.12)
        : 0;
  return off + Math.max(0, pause - 1.2);
}

/**
 * Corta la narración de una escena en sus frases: por la mitad de las pausas más largas que no
 * están en los bordes, una menos que frases. Devuelve los tramos, o `null` si no hay tantas pausas
 * o si algún tramo no cuadra con su texto: cada frase tiene que leerse a un ritmo parecido al de
 * las demás (±40 % de segundos por letra), o una pausa dentro de una frase se tomó por el cambio.
 */
function splitScene(file, texts) {
  const total = secondsOf(file);
  const inner = silencesOf(file).filter(
    (silence) => silence.start > 0.05 && silence.end < total - 0.05,
  );
  if (inner.length < texts.length - 1) return null;
  const cuts = [...inner]
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, texts.length - 1)
    .sort((a, b) => a.start - b.start)
    .map((silence) => (silence.start + silence.end) / 2);
  const segments = [0, ...cuts].map((from, index) => ({
    from,
    to: cuts[index] ?? null,
  }));
  const rates = segments.map(
    (segment, index) =>
      ((segment.to ?? total) - segment.from) / texts[index].length,
  );
  const median = [...rates].sort((a, b) => a - b)[Math.floor(rates.length / 2)];
  const consistent = rates.every(
    (rate) => Math.abs(rate - median) / median <= 0.4,
  );
  return consistent ? segments : null;
}

function extract(file, segment, target) {
  const args = ["-v", "error", "-y", "-i", file, "-ss", String(segment.from)];
  if (segment.to !== null) args.push("-to", String(segment.to));
  args.push(target);
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
}

const plain = (markup) => markup.replace(/<\/?hl>/g, "");

if (options.texto) {
  const file = path.join(outDir, `muestra-${voice}.wav`);
  fs.writeFileSync(file, await speak(options.texto));
  console.log(file);
} else {
  const messages = JSON.parse(
    fs.readFileSync(`src/i18n/messages/${locale}.json`, "utf8"),
  );
  const section = options.catalogo
    ? JSON.parse(fs.readFileSync(options.catalogo, "utf8"))[locale]
    : messages.pillarAnimations[options.seccion ?? "overview"];
  const keys = options.claves
    ? options.claves.split(",")
    : Object.entries(section)
        .filter(([, beats]) => typeof beats === "object")
        .flatMap(([scene, beats]) =>
          Object.keys(beats)
            .filter((beat) => /^b\d$/.test(beat))
            .map((beat) => `${scene}.${beat}`),
        );

  const pending = [...keys];
  if ("por-escena" in options) {
    const scenes = [...new Set(keys.map((key) => key.split(".")[0]))];
    for (const scene of scenes) {
      const beats = keys.filter((key) => key.startsWith(`${scene}.`));
      const texts = beats.map((key) =>
        plain(section[scene][key.split(".")[1]]),
      );
      const text = texts.join("\n\n");
      const whole = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), "narracion-")),
        `${scene}.wav`,
      );
      fs.writeFileSync(whole, await speak(text, SCENE_DIRECTION));
      const segments = splitScene(whole, texts);
      const targets = beats.map((key) => path.join(outDir, `${key}.wav`));
      targets.forEach((target, index) => {
        if (segments) extract(whole, segments[index], target);
      });
      if (
        !segments ||
        targets.some((target, index) =>
          flawOf(measureTake(target, texts[index])),
        )
      ) {
        console.log(`${scene}: no se deja cortar; va frase por frase`);
        continue;
      }
      beats.forEach((key, index) => {
        pending.splice(pending.indexOf(key), 1);
        console.log(targets[index]);
      });
    }
  }
  for (const key of pending) {
    const [scene, beat] = key.split(".");
    const file = path.join(outDir, `${scene}.${beat}.wav`);
    const text = plain(section[scene][beat]);
    /* La toma que no suena bien (`flawOf`) se vuelve a pedir, hasta tres veces; si ninguna cuadra,
       se queda la más cercana. */
    let best = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      let audio;
      try {
        audio = await speak(text);
      } catch (error) {
        if (/per_day/i.test(error.message)) throw error;
        console.log(`${key}: ${error.message} (intento ${attempt})`);
        continue;
      }
      fs.writeFileSync(file, audio);
      const take = measureTake(file, text);
      const flaw = flawOf(take);
      if (!best || flaw < best.flaw) best = { audio, flaw };
      if (!flaw) break;
      console.log(
        `${key}: ${take.rate.toFixed(3)} s de voz por letra y una pausa de ${take.pause.toFixed(2)} s no cuadran (intento ${attempt})`,
      );
    }
    if (!best) throw new Error(`${key}: ninguna toma trajo audio`);
    fs.writeFileSync(file, best.audio);
    console.log(file);
  }
}
