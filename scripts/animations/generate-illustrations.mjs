/**
 * Genera las ilustraciones de una animación con Gemini a partir de un manifiesto.
 *
 *   node scripts/animations/generate-illustrations.mjs <manifiesto.json> <carpeta-salida> [id,id…]
 *
 * El manifiesto trae la dirección de arte común (`style`), las imágenes de referencia de todas
 * (`refs`, relativas a la raíz del repo) y una entrada por ilustración con su indicación y sus
 * referencias propias (relativas a la carpeta de salida: así la hoja de personajes generada primero
 * sirve de referencia a las demás). Genera tres a la vez; cada imagen tiene costo en la cuenta de
 * Google de `GEMINI_API_KEY`, que se lee del entorno o de `.env.development`.
 *
 * Proceso completo en docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares-ilustraciones.md.
 */
import fs from "node:fs";
import path from "node:path";

const [manifestPath, outDir, onlyIds] = process.argv.slice(2);
if (!manifestPath || !outDir) {
  console.error(
    "Uso: node scripts/animations/generate-illustrations.mjs <manifiesto.json> <carpeta-salida> [id,id…]",
  );
  process.exit(1);
}

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

const key = readKey();
if (!key) throw new Error("Falta GEMINI_API_KEY");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const wanted = onlyIds ? new Set(onlyIds.split(",")) : null;
const model = manifest.model ?? "gemini-3-pro-image";
fs.mkdirSync(outDir, { recursive: true });

const mimeOf = (file) =>
  file.endsWith(".png")
    ? "image/png"
    : file.endsWith(".jpg")
      ? "image/jpeg"
      : "image/webp";

const inline = (file) => ({
  inlineData: {
    mimeType: mimeOf(file),
    data: fs.readFileSync(file).toString("base64"),
  },
});

async function generate(item) {
  const parts = [
    { text: `${manifest.style}\n\n${item.prompt}` },
    ...(manifest.refs ?? []).map((ref) => inline(ref)),
    ...(item.refs ?? []).map((ref) => inline(path.join(outDir, ref))),
  ];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: item.aspect ?? "16:9", imageSize: "2K" },
        },
      }),
    },
  );
  const json = await response.json();
  if (json.error) throw new Error(`${item.id}: ${json.error.message}`);
  const image = json.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );
  if (!image) throw new Error(`${item.id}: la respuesta no trae imagen`);
  const extension = image.inlineData.mimeType.includes("jpeg") ? "jpg" : "png";
  const file = path.join(outDir, `${item.id}.${extension}`);
  fs.writeFileSync(file, Buffer.from(image.inlineData.data, "base64"));
  return `${item.id} → ${file}`;
}

const items = manifest.items.filter((item) => !wanted || wanted.has(item.id));
let cursor = 0;
const failures = [];
await Promise.all(
  Array.from({ length: Math.min(3, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        console.log(await generate(item));
      } catch (error) {
        failures.push(item.id);
        console.error(`ERROR ${error.message}`);
      }
    }
  }),
);
if (failures.length) {
  console.error(`Fallaron: ${failures.join(",")}`);
  process.exit(1);
}
