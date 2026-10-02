/**
 * Genera música de fondo original con Lyria (API de Interactions de Gemini).
 *
 *   node scripts/animations/generate-music.mjs --salida=out/music [--propuestas=calida,folk,ambiental]
 *        [--duracion=170]
 *
 * Cada propuesta es una pieza instrumental pensada para ir debajo de la voz; `--duracion` (en
 * segundos, 120 por omisión) es lo que se le pide que dure, y conviene pedir unos segundos más de
 * lo que dura el video: la mezcla alinea el final de la pieza con el final del video.
 * La música generada es original (no está en ningún catálogo) y lleva la marca de agua SynthID.
 * Tiene costo: 0,08 USD por pieza con la tarifa publicada. Usa `GEMINI_API_KEY`.
 *
 * **Lyria mete voces si el prompt las evoca**, aunque se le pida música instrumental: con «narrated
 * by a male voice» puso a un hombre hablando en tres piezas, y con «community… neighbours
 * gathering» un coro. Con «synth pads» puede salir un pad que suena a coro («aah»), que también se
 * oye como gente; en las piezas lentas con cuerdas Lyria los pone aunque no se le pidan. Por eso
 * ningún prompt nombra voces, narración, gente ni pads, las piezas lentas (nocturna, presencia) son
 * de piano solo, y cada pieza la escucha Gemini antes de guardarla, en ventanas de 15 s
 * traslapadas: la que trae algo que suene a voces se pide otra vez, hasta tres veces.
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

const seconds = Number(options.duracion ?? 120);
const length =
  seconds % 60 === 0
    ? `${seconds / 60} minutes`
    : `${Math.floor(seconds / 60)} minutes and ${seconds % 60} seconds`;

const COMMON = `Instrumental only. A soft, understated background underscore for a hopeful wellness documentary, leaving plenty of space. About ${length} long, with a soft, resolved ending.`;

const PROPOSALS = {
  calida:
    "Warm, hopeful cinematic underscore: soft felt piano, gentle strings, subtle pads, light hand percussion. 78 BPM, D major. Intimate at the start, slowly growing warmer and more uplifting.",
  /* Sin nombrar un estilo nacional: «Mexican folk» lo bloqueó el filtro de Lyria sin decir por qué.
     Los instrumentos ya dan ese color. */
  folk: "Earthy, hopeful acoustic underscore: nylon-string guitar, soft marimba accents, warm upright bass, brushed percussion, a touch of strings. 84 BPM, G major. Gentle and warm, a little brighter in the middle.",
  /* La de la animación de Sueño: va de la noche al amanecer, como la práctica «Del atardecer al
     amanecer». */
  nocturna:
    "Gentle nocturnal lullaby for solo felt piano with celesta and music-box touches, slowly turning into a hopeful dawn. 70 BPM, F major. Dark, hushed and intimate at the start, brightening little by little, and resolving warmly like a sunrise at the end.",
  /* La de Alimentación: cálida y casera, de la milpa a la cena al atardecer. */
  cocina:
    "Earthy, warm acoustic underscore with a homely, sunlit feeling: nylon-string guitar, soft marimba, light hand percussion, warm strings and a gentle wooden flute. 84 BPM, G major. Friendly and grounded at the start, a little more wistful in the middle, and resolving warmly like a sunset.",
  /* La de Movimiento: paso de caminata por el barrio. */
  caminata:
    "Bright, light-footed acoustic underscore with a gentle walking groove: acoustic guitar strums, soft marimba, shakers and brushed percussion. 100 BPM, D major. Easy-going at the start, a little livelier in the middle, and resolving warmly at the end of the day.",
  /* La de Mente y espíritu: calma y presencia. */
  presencia:
    "Calm and warm solo felt piano piece about presence and stillness, with soft chimes and a subtle low pulse like a slow heartbeat. 68 BPM, A major. Quiet and inward at the start, opening up gently, and ending warmly like the last light at dusk.",
  ambiental:
    "Modern, airy ambient underscore: evolving warm synth pads, soft plucked textures, a light pulse, occasional piano notes, a feeling of sunrise and renewal. 80 BPM, C major. Calm and never busy, with a gentle swell toward the end.",
};

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

const LISTENER = "gemini-3.1-pro-preview";
const CLIP_SECONDS = 15;
const LISTEN_PROMPT = `Listen carefully to this short music clip. Answer two questions:
1. Is there any real human voice — singers, a choir, "aah"/"ooh" vocals, humming, speech, whispers, crowd sounds?
2. Is there any vocal-like texture that an ordinary listener could hear as people or voices, even if it is synthesized — a choir-like synth pad, a vocal sample, an "aah" pad?
Answer only with JSON: {"humanVoice": true|false, "vocalLike": true|false, "description": "..."}`;

function secondsOf(file) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number(probe.stdout.trim());
}

/** Lo que Gemini oye en un tramo: si hay voz humana o algo que se oiga como voces. */
async function listen(clip) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${LISTENER}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": readKey(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/mpeg",
                  data: fs.readFileSync(clip).toString("base64"),
                },
              },
              { text: LISTEN_PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      }),
    },
  );
  const json = await response.json();
  if (json.error) throw new Error(`${LISTENER}: ${json.error.message}`);
  const text = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");
  const heard = JSON.parse(text);
  return Array.isArray(heard) ? heard[0] : heard;
}

/**
 * Los tramos de una pieza que suenan a voces, reales o de sintetizador; vacío si no hay ninguno.
 * Se escucha en ventanas de 15 s que se traslapan a la mitad: con la pieza entera, o con cortes
 * fijos, a Gemini se le escapan las texturas tenues que caen en el borde de un tramo.
 */
async function voicesIn(file) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "musica-"));
  const voices = [];
  for (let start = 0; start < secondsOf(file) - 2; start += CLIP_SECONDS / 2) {
    const clip = path.join(work, `${start}.mp3`);
    spawnSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      String(start),
      "-t",
      String(CLIP_SECONDS),
      "-i",
      file,
      clip,
    ]);
    const heard = await listen(clip);
    if (heard.humanVoice || heard.vocalLike) {
      voices.push({ start, description: heard.description });
    }
  }
  return voices;
}

/** Busca el audio en la respuesta, donde sea que venga: la forma de la API aún es preliminar. */
function findAudio(node) {
  if (!node || typeof node !== "object") return null;
  for (const [key, value] of Object.entries(node)) {
    if (
      typeof value === "string" &&
      value.length > 10_000 &&
      /audio|data/i.test(key)
    ) {
      return value;
    }
    const nested = findAudio(value);
    if (nested) return nested;
  }
  return null;
}

const outDir = options.salida ?? "out/music";
fs.mkdirSync(outDir, { recursive: true });
const wanted = (options.propuestas ?? Object.keys(PROPOSALS).join(",")).split(
  ",",
);

/** Una pieza de Lyria, en base64, o `null` si la respuesta no la trae. */
async function compose(name) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": readKey(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: options.modelo ?? "lyria-3.5",
        input: `${COMMON} ${PROPOSALS[name]}`,
      }),
    },
  );
  const json = await response.json();
  if (json.error) {
    console.error(`${name}: ${json.error.message}`);
    return null;
  }
  const audio = findAudio(json);
  if (!audio) {
    console.log(
      `${name}: la respuesta no trae audio`,
      JSON.stringify(json).slice(0, 400),
    );
  }
  return audio;
}

for (const name of wanted) {
  const file = path.join(outDir, `${name}-${seconds}s.mp3`);
  const draft = path.join(outDir, `${name}-${seconds}s.borrador.mp3`);
  let saved = false;
  for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
    const audio = await compose(name);
    if (!audio) continue;
    fs.writeFileSync(draft, Buffer.from(audio, "base64"));
    let voices;
    try {
      voices = await voicesIn(draft);
    } catch (error) {
      /* Sin escucha no se guarda como buena: queda el borrador, sin revisar, y se para. */
      console.error(`${name}: no se pudo escuchar (${error.message})`);
      console.error(`${name}: queda sin revisar en ${draft}`);
      process.exit(1);
    }
    if (voices.length) {
      const where = voices.map((voice) => `${voice.start} s`).join(", ");
      console.log(
        `${name}: suena a voces en ${where}; se pide otra (intento ${attempt})`,
      );
      continue;
    }
    fs.renameSync(draft, file);
    console.log(file);
    saved = true;
  }
  fs.rmSync(draft, { force: true });
  if (!saved) console.error(`${name}: ninguna pieza salió sin voces`);
}
