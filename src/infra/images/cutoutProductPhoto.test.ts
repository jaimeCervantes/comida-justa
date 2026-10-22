import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { cutoutProductPhoto } from "./cutoutProductPhoto";

/**
 * Un «frasco» rojo de 20×20 en el centro de un lienzo de 40×40, con una «etiqueta» blanca de 4×4 en
 * medio del frasco. `background` es el color del lienzo.
 */
async function photo(background: { r: number; g: number; b: number }) {
  const label = await sharp({
    create: { width: 4, height: 4, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();
  const jar = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#c52e0b" },
  })
    .composite([{ input: label, left: 8, top: 8 }])
    .png()
    .toBuffer();

  return sharp({
    create: { width: 40, height: 40, channels: 3, background },
  })
    .composite([{ input: jar, left: 10, top: 10 }])
    .png()
    .toBuffer();
}

async function alphaAt(png: Buffer, x: number, y: number): Promise<number> {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return data[(y * info.width + x) * 4 + 3];
}

describe("cutoutProductPhoto", () => {
  it("quita el fondo blanco y deja la etiqueta blanca del producto", async () => {
    const { png, isCutout } = await cutoutProductPhoto(
      await photo({ r: 255, g: 255, b: 255 }),
      100,
      100,
    );
    const { width, height } = await sharp(png).metadata();

    expect(isCutout).toBe(true);
    /* El fondo se fue y se recortó al producto: queda el frasco de 20×20. */
    expect([width, height]).toEqual([20, 20]);
    /* La etiqueta, en (8, 8) del frasco, sigue opaca: no está conectada al borde. */
    expect(await alphaAt(png, 9, 9)).toBe(255);
  });

  it("una foto que no es de estudio se devuelve sin recortar", async () => {
    const { png, isCutout } = await cutoutProductPhoto(
      await photo({ r: 90, g: 120, b: 60 }),
      100,
      100,
    );
    const { width } = await sharp(png).metadata();

    expect(isCutout).toBe(false);
    expect(width).toBe(40);
    expect(await alphaAt(png, 0, 0)).toBe(255);
  });
});
