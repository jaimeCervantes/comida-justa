import sharp from "sharp";

/** Cuánto puede alejarse un píxel del blanco puro y seguir contando como fondo (JPEG ensucia). */
const WHITE_THRESHOLD = 232;

/**
 * Si menos de esta fracción del borde es blanca, la foto no es de estudio: no se recorta, porque el
 * relleno se comería un fondo que forma parte de la foto.
 */
const MIN_WHITE_BORDER = 0.35;

export type ProductPhoto = {
  png: Buffer;
  /** `true` si se le quitó el fondo; `false` si se devuelve tal cual, para pintarla como tarjeta. */
  isCutout: boolean;
};

function isNearWhite(data: Buffer, offset: number): boolean {
  return (
    data[offset] >= WHITE_THRESHOLD &&
    data[offset + 1] >= WHITE_THRESHOLD &&
    data[offset + 2] >= WHITE_THRESHOLD
  );
}

/**
 * La foto de un producto, sin su fondo blanco, para que flote sobre el banner como en los
 * carruseles de un marketplace.
 *
 * **Relleno desde los bordes, no un umbral.** Volver transparente todo lo blanco agujereaba el
 * producto: la etiqueta de un frasco, un logo, el brillo de una bolsa. Aquí solo se quita el blanco
 * **conectado al borde** de la imagen, que es el fondo de estudio; lo blanco de adentro se queda.
 *
 * Una foto que no está sobre blanco (una mesa, un mercado) se devuelve sin tocar y con
 * `isCutout: false`.
 */
export async function cutoutProductPhoto(
  input: Buffer,
  maxWidth: number,
  maxHeight: number,
): Promise<ProductPhoto> {
  const { data, info } = await sharp(input)
    .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const at = (x: number, y: number) => (y * width + x) * 4;

  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(at(x, 0), at(x, height - 1));
  for (let y = 1; y < height - 1; y++) border.push(at(0, y), at(width - 1, y));

  const whiteBorder = border.filter((offset) => isNearWhite(data, offset));

  if (whiteBorder.length / border.length < MIN_WHITE_BORDER) {
    return {
      png: await sharp(data, { raw: { width, height, channels: 4 } })
        .png()
        .toBuffer(),
      isCutout: false,
    };
  }

  /* Recorrido en anchura con una pila de índices de píxel: sin recursión, que en una foto de
     600×600 desbordaría la pila de llamadas. */
  const visited = new Uint8Array(width * height);
  const stack = whiteBorder.map((offset) => offset / 4);

  for (const pixel of stack) visited[pixel] = 1;

  while (stack.length > 0) {
    const pixel = stack.pop() as number;
    const x = pixel % width;
    const y = (pixel - x) / width;

    data[pixel * 4 + 3] = 0;

    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

      const next = ny * width + nx;

      if (visited[next] || !isNearWhite(data, next * 4)) continue;
      visited[next] = 1;
      stack.push(next);
    }
  }

  return {
    png: await sharp(data, { raw: { width, height, channels: 4 } })
      .trim()
      .png()
      .toBuffer(),
    isCutout: true,
  };
}
