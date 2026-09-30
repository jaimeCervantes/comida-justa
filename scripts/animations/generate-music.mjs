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

const COMMON = `Instrumental only, no vocals. Underscore for a hopeful wellness documentary narrated by a male voice: keep it understated so the narration sits clearly on top. About ${length} long, with a soft, resolved ending.`;

const PROPOSALS = {
  calida:
    "Warm, hopeful cinematic underscore: soft felt piano, gentle strings, subtle pads, light hand percussion. 78 BPM, D major. Intimate at the start, slowly growing warmer and more uplifting.",
  /* Sin nombrar un estilo nacional: «Mexican folk» lo bloqueó el filtro de Lyria sin decir por qué.
     Los instrumentos ya dan ese color. */
  folk: "Earthy, hopeful acoustic underscore: nylon-string guitar, soft marimba accents, warm upright bass, brushed percussion, a touch of strings. 84 BPM, G major. Gentle and warm, a little brighter in the middle.",
  /* La de la animación de Sueño: va de la noche al amanecer, como la práctica «Del atardecer al
     amanecer». */
  nocturna:
    "Gentle nocturnal lullaby underscore that slowly turns into a hopeful dawn: soft felt piano, celesta and music-box touches, warm low strings and airy pads. 70 BPM, F major. Dark, hushed and intimate at the start, brightening little by little, and resolving warmly like a sunrise at the end.",
  /* La de Alimentación: mercado y cocina, de la milpa a la cena al atardecer. */
  cocina:
    "Earthy, warm acoustic underscore that feels like a sunny street market and a family kitchen: nylon-string guitar, soft marimba, light hand percussion, warm strings and a gentle wooden flute. 84 BPM, G major. Friendly and grounded at the start, a little more wistful in the middle, and resolving warmly like a dinner at sunset.",
  /* La de Movimiento: paso de caminata por el barrio. */
  caminata:
    "Bright, light-footed acoustic underscore with a gentle walking groove: acoustic guitar strums, soft marimba, light hand claps and brushed percussion. 100 BPM, D major. Easy-going at the start, a little livelier in the middle, and resolving warmly like an evening walk home.",
  /* La de Mente y espíritu: calma, presencia y gente cerca. */
  presencia:
    "Calm, spacious and warm underscore about presence and community: soft felt piano, gentle strings, warm pads, soft chimes and a subtle pulse like a slow heartbeat. 68 BPM, A major. Quiet and inward at the start, opening up gently, and ending warmly like neighbours gathering at dusk.",
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

for (const name of wanted) {
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
    continue;
  }
  const audio = findAudio(json);
  if (!audio) {
    console.log(
      `${name}: la respuesta no trae audio`,
      JSON.stringify(json).slice(0, 400),
    );
    continue;
  }
  const file = path.join(outDir, `${name}-${seconds}s.mp3`);
  fs.writeFileSync(file, Buffer.from(audio, "base64"));
  console.log(file);
}
