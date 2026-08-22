import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `priority` está **deprecado en Next 16** a favor de `preload`, y no fue un cambio de nombre.
 *
 * `priority` hacía dos cosas que ahora se piden por separado: adelantar la descarga (`preload`, que
 * emite el `<link rel="preload" as="image">`) y poner la imagen **por delante de las demás**
 * (`fetchPriority`). Next dejó de derivar la segunda, así que las seis llamadas del sitio seguían
 * precargando bien y **ninguna imagen emitía `fetchpriority`** — medido sobre el HTML del servidor:
 * 13 imágenes en `/suero-natural`, cero priorizadas.
 *
 * Se comprueba en el tipo del propio Next, no en una constante escrita aquí: si una versión futura
 * retira `preload` o resucita `priority`, esta prueba lo dice.
 */
const NEXT_IMAGE_TYPES = readFileSync(
  "node_modules/next/dist/shared/lib/get-img-props.d.ts",
  "utf8",
);

function sourceFiles(): string[] {
  return globSync("src/**/*.tsx").filter((file) => !file.includes(".test."));
}

/** `priority` como prop de JSX, no la palabra dentro de un comentario. */
const DEPRECATED_PROP = /<[A-Z][\w.]*(?:\s[^>]*)?\spriority(?:[\s=/>])/;

describe("la prioridad de las imágenes", () => {
  it("Next sigue deprecando `priority` a favor de `preload`", () => {
    expect(NEXT_IMAGE_TYPES).toMatch(/@deprecated Use `preload` prop instead/);
    expect(NEXT_IMAGE_TYPES).toMatch(/preload\?: boolean/);
  });

  it("ningún componente pide la prop deprecada", () => {
    const offenders = sourceFiles().filter((file) =>
      DEPRECATED_PROP.test(readFileSync(file, "utf8")),
    );

    expect(
      offenders,
      `${offenders.join(", ")} usa \`priority\`, que Next 16 deprecó. ` +
        "Es `preload` para adelantar la descarga, y `fetchPriority` para ir por delante.",
    ).toEqual([]);
  });

  /*
   * La otra mitad: si nadie pide `fetchPriority`, ninguna imagen va por delante y el trabajo de
   * este arreglo se habría deshecho sin que nada avisara — que es exactamente como llegó aquí.
   */
  it("y alguna sí pide ir por delante: si no, no se prioriza nada", () => {
    const withFetchPriority = sourceFiles().filter((file) =>
      /fetchPriority="high"/.test(readFileSync(file, "utf8")),
    );

    expect(withFetchPriority.length).toBeGreaterThan(0);
  });

  /* El patrón no puede confundir un comentario que la mencione con una prop de verdad. */
  it.each<[string, boolean]>([
    ['<Image src="a" priority />', true],
    ["<Image priority={true} />", true],
    ['<MediaContent media={m} preload fetchPriority="high" />', false],
    ["// se llamaba priority antes de Next 16", false],
    ["<Image preload />", false],
  ])("reconoce %s como prop deprecada: %s", (source, isDeprecated) => {
    expect(DEPRECATED_PROP.test(source)).toBe(isDeprecated);
  });
});
