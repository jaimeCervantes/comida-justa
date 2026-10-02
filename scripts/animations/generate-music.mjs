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
 * gathering» un coro. Por eso ningún prompt nombra voces, narración ni gente, y cada pieza la
 * escucha Gemini antes de guardarla: la que trae voces se pide otra vez, hasta tres veces.
 */
import fs from "node:fs";
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
    "Gentle nocturnal underscore with a music-box lullaby melody that slowly turns into a hopeful dawn: soft felt piano, celesta and music-box touches, warm low strings and airy synth pads. 70 BPM, F major. Dark, hushed and intimate at the start, brightening little by little, and resolving warmly like a sunrise at the end.",
  /* La de Alimentación: cálida y casera, de la milpa a la cena al atardecer. */
  cocina:
    "Earthy, warm acoustic underscore with a homely, sunlit feeling: nylon-string guitar, soft marimba, light hand percussion, warm strings and a gentle wooden flute. 84 BPM, G major. Friendly and grounded at the start, a little more wistful in the middle, and resolving warmly like a sunset.",
  /* La de Movimiento: paso de caminata por el barrio. */
  caminata:
    "Bright, light-footed acoustic underscore with a gentle walking groove: acoustic guitar strums, soft marimba, shakers and brushed percussion. 100 BPM, D major. Easy-going at the start, a little livelier in the middle, and resolving warmly at the end of the day.",
  /* La de Mente y espíritu: calma y presencia. */
  presencia:
    "Calm, spacious and warm underscore about presence and stillness: soft felt piano, gentle strings, warm synth pads, soft chimes and a subtle pulse like a slow heartbeat. 68 BPM, A major. Quiet and inward at the start, opening up gently, and ending warmly like the last light at dusk.",
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
const LISTEN_PROMPT = `Listen carefully to this whole music track, from start to end. Report every moment where you can hear any human voice or vocal-like sound: singing, humming, "oohs" or "aahs", choir, whispering, spoken words, murmuring, crowd chatter or laughter, even if faint or in the background. Answer only with JSON: {"segments": [{"start": "m:ss", "end": "m:ss", "kind": "..."}]}, with an empty list if there are none.`;

/** Los tramos con voces de una pieza, según Gemini; vacío si es instrumental de verdad. */
async function voicesIn(audio) {
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
              { inlineData: { mimeType: "audio/mpeg", data: audio } },
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
  return JSON.parse(text).segments ?? [];
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
  let saved = false;
  for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
    const audio = await compose(name);
    if (!audio) continue;
    const voices = await voicesIn(audio);
    if (voices.length) {
      const where = voices
        .map((voice) => `${voice.start}–${voice.end} ${voice.kind}`)
        .join(", ");
      console.log(
        `${name}: trae voces (${where}); se pide otra (intento ${attempt})`,
      );
      continue;
    }
    fs.writeFileSync(file, Buffer.from(audio, "base64"));
    console.log(file);
    saved = true;
  }
  if (!saved) console.error(`${name}: ninguna pieza salió sin voces`);
}
