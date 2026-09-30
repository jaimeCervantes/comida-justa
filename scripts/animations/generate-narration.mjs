/**
 * Genera la locución de la animación con Gemini TTS.
 *
 *   node scripts/animations/generate-narration.mjs --voz=Charon --salida=<carpeta> [--idioma=es]
 *        [--claves=intro.b1,intro.b2] [--texto="…"]
 *
 * Una pista por subtítulo (`<escena>.<subtítulo>.wav`), leída del catálogo de traducción sin las
 * marcas `<hl>`. Con `--texto` genera una sola muestra con ese texto: sirve para elegir la voz.
 * Usa `GEMINI_API_KEY` (del entorno o de `.env.development`); tiene costo, pequeño.
 */
import fs from "node:fs";
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
 * sistema; por eso el modelo por omisión es el 2.5 Pro.)
 *
 * El acento sale latinoamericano neutro, el de muchos locutores en México: pedir «acento mexicano»
 * no lo vuelve más regional.
 */
const DIRECTION = {
  es: "Say in a deep, warm, close male voice with a natural Mexican Spanish accent, like the narrator of a hopeful documentary, at a calm but not slow pace:",
  en: "Say in a deep, warm, close male voice, like the narrator of a hopeful documentary, at a calm but not slow pace:",
}[locale];

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

async function speak(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": readKey(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${DIRECTION} ${text}` }] }],
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
  if (json.error) throw new Error(json.error.message);
  const audio = json.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );
  if (!audio) throw new Error("La respuesta no trae audio");
  return wav(Buffer.from(audio.inlineData.data, "base64"));
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
  const overview = messages.pillarAnimations.overview;
  const keys = options.claves
    ? options.claves.split(",")
    : Object.entries(overview).flatMap(([scene, beats]) =>
        Object.keys(beats)
          .filter((beat) => /^b\d$/.test(beat))
          .map((beat) => `${scene}.${beat}`),
      );
  for (const key of keys) {
    const [scene, beat] = key.split(".");
    const file = path.join(outDir, `${scene}.${beat}.wav`);
    fs.writeFileSync(file, await speak(plain(overview[scene][beat])));
    console.log(file);
  }
}
