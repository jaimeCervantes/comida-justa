import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import sharp from "sharp";

config({
  path: resolve(process.cwd(), `.env.${process.env.NODE_ENV || "development"}`),
});

/**
 * Genera **una vez** los fondos del banner de ofertas con Gemini y los guarda en
 * `src/assets/banners/`.
 *
 *   pnpm tsx src/scripts/generateOffersBannerBackgrounds.ts               los dos
 *   pnpm tsx src/scripts/generateOffersBannerBackgrounds.ts fondo-compacto.png   solo uno
 *
 * Se generan fuera de la petición a propósito: un fondo por visita costaría dinero y segundos, y
 * cambiaría de una visita a otra. Y **solo el fondo** sale de la IA: los productos, sus precios y sus
 * descuentos los dibuja `next/og` con las fotos y los datos reales, así que el modelo nunca puede
 * alterar un producto ni inventar una cifra.
 *
 * Volver a correrlo reemplaza los archivos. Revisarlos a ojo antes de commitearlos.
 */
const MODEL = "gemini-2.5-flash-image";

const STYLE = [
  "Abstract background for a modern e-commerce promotional banner, in the style of a big marketplace",
  "home carousel. Vibrant gradient from deep forest green (#2f5320) to fresh leaf green (#538f39),",
  "with large soft organic blob shapes, a few subtle warm terracotta (#dd340d) and cream accents,",
  "gentle light glow and depth. Leave the left third calm and darker for white headline text, and the",
  "right side open for products to be placed on top later.",
  "Flat, clean, premium, minimal. Absolutely no text, no letters, no numbers, no logos, no products,",
  "no people, no food.",
  "Full-bleed: the artwork fills the entire canvas edge to edge. It is NOT a mockup: no frame, no",
  "rounded card, no border, no drop shadow, no device, no grey surrounding background, no placeholder",
  "words such as HEADLINE.",
].join(" ");

const BACKGROUNDS = [
  {
    file: "fondo-ancho.png",
    aspectRatio: "21:9",
    width: 1600,
    height: 520,
    framing: "Very wide horizontal composition.",
  },
  {
    file: "fondo-compacto.png",
    aspectRatio: "4:3",
    width: 1080,
    height: 810,
    framing:
      "Horizontal composition for a phone screen. Keep the top area calm for the headline; products go along the bottom.",
  },
] as const;

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { inlineData?: { data?: string } }[] };
  }[];
  error?: { message?: string };
};

async function generate(prompt: string, aspectRatio: string): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY;

  if (!key) throw new Error("Falta GEMINI_API_KEY en el .env.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio },
        },
      }),
    },
  );
  const body = (await response.json()) as GeminiResponse;
  const data = body.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData?.data;

  if (!response.ok || !data) {
    throw new Error(
      `Gemini no devolvió imagen (${response.status}): ${body.error?.message ?? "sin detalle"}`,
    );
  }

  return Buffer.from(data, "base64");
}

async function main() {
  const dir = join(process.cwd(), "src", "assets", "banners");
  await mkdir(dir, { recursive: true });

  const only = process.argv[2];

  for (const background of BACKGROUNDS) {
    if (only && background.file !== only) continue;

    const raw = await generate(
      `${STYLE} ${background.framing}`,
      background.aspectRatio,
    );
    /* Al tamaño exacto del formato: Satori la pinta tal cual, sin recortarla. */
    const png = await sharp(raw)
      .resize(background.width, background.height, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toBuffer();

    await writeFile(join(dir, background.file), png);
    console.log(`${background.file}: ${png.length} bytes`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
