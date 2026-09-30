/**
 * Prepara las ilustraciones generadas para la web: tres anchos en WebP por cada una.
 *
 *   node scripts/animations/prepare-illustrations.mjs <carpeta-con-los-jpg> [id,id…]
 *
 * Las imágenes se sirven tal cual (`images.unoptimized` en `next.config.mjs`), así que el `srcSet`
 * de las escenas necesita los anchos ya hechos: 960 para teléfonos, 1440 y 1920 para pantallas
 * grandes. Se escriben en `public/animations/pilares/<id>-<ancho>.webp`.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [sourceDir, onlyIds] = process.argv.slice(2);
if (!sourceDir) {
  console.error(
    "Uso: node scripts/animations/prepare-illustrations.mjs <carpeta-con-los-jpg> [id,id…]",
  );
  process.exit(1);
}

const OUT_DIR = "public/animations/pilares";
const WIDTHS = [
  { width: 960, quality: 80 },
  { width: 1440, quality: 84 },
  { width: 1920, quality: 84 },
];
const wanted = onlyIds ? new Set(onlyIds.split(",")) : null;
fs.mkdirSync(OUT_DIR, { recursive: true });

const sources = fs
  .readdirSync(sourceDir)
  /* Solo ilustraciones de escena («intro-1.jpg», «sleep-cost-2.jpg»): ni la hoja de personajes ni
     otras imágenes de trabajo, que no terminan en número. */
  .filter((file) => /^[a-z]+(?:-[a-z]+)*-\d+\.(jpe?g|png)$/.test(file))
  .filter((file) => !wanted || wanted.has(path.parse(file).name));

for (const file of sources) {
  const id = path.parse(file).name;
  for (const { width, quality } of WIDTHS) {
    await sharp(path.join(sourceDir, file))
      .resize({ width })
      .webp({ quality, effort: 6 })
      .toFile(path.join(OUT_DIR, `${id}-${width}.webp`));
  }
  console.log(`${id}: ${WIDTHS.map(({ width }) => width).join(", ")}`);
}
