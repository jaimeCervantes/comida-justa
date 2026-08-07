/**
 * Busca texto en español escrito a mano dentro de los componentes.
 *
 * El tipado de `next-intl.d.ts` ya garantiza que toda clave que se use **exista**. Lo que no puede
 * ver el compilador es el texto que nunca salió del TSX: un literal en JSX compila perfectamente.
 * Este grep es la otra mitad, y por eso hacen falta los dos.
 *
 * La heurística son los caracteres que solo aparecen en español (`áéíóúñ¿¡`…). No detecta un
 * literal sin acentos —"Publish" o "Local" pasan—, y no pretende: sirve para medir el avance de la
 * extracción y para que una regresión evidente falle en CI, no para demostrar que no queda nada.
 *
 * Uso: `pnpm run check:i18n`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { stripComments } from "./stripComments";

const ROOTS = ["src/app", "src/infra/UI"];
const SPANISH = /[áéíóúÁÉÍÓÚñÑ¿¡]/;

/** Archivos cuyo texto no llega a un visitante. */
const IGNORED = [
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /[/\\]stories[/\\]/,
  /[/\\]__mocks__[/\\]/,
  // Datos de relleno para pruebas y Storybook: no los ve nadie desde el navegador.
  /[/\\]dummies[/\\]/,
  /seoDummies\.ts$/,
  /**
   * El 404 raíz vive fuera de `[locale]`: responde a direcciones que no casan con ninguna ruta, no
   * tiene segmento de idioma que leer y se queda en el idioma por omisión a propósito. Ver la
   * sección de i18n en `AGENTS.md`.
   */
  /^src[/\\]app[/\\]not-found\.tsx$/,
];

/**
 * Escotilla para el texto que **debe** seguir en español. Hoy solo la usa el nombre del idioma en
 * el selector: "Español" se escribe igual en una interfaz en inglés. Se marca la línea con
 * `// i18n-ignore` y se explica al lado por qué, para que no se convierta en un cajón de sastre.
 */
const IGNORE_LINE = /\/\/\s*i18n-ignore/;

type Finding = { file: string; line: number; text: string };

function collectFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectFiles(path, found);
      continue;
    }
    if (
      /\.tsx?$/.test(path) &&
      !IGNORED.some((pattern) => pattern.test(path))
    ) {
      found.push(path);
    }
  }
  return found;
}

function findSpanishLiterals(file: string): Finding[] {
  const source = readFileSync(file, "utf8");
  const original = source.split("\n");
  const lines = stripComments(source).split("\n");

  return lines.flatMap((line, index) =>
    // La marca vale en la propia línea o en la de encima, que es donde cabe la explicación.
    SPANISH.test(line) &&
    !IGNORE_LINE.test(original[index] ?? "") &&
    !IGNORE_LINE.test(original[index - 1] ?? "")
      ? [
          {
            file: relative(process.cwd(), file).replace(/\\/g, "/"),
            line: index + 1,
            text: line.trim(),
          },
        ]
      : [],
  );
}

const findings = ROOTS.flatMap((root) => collectFiles(root)).flatMap(
  findSpanishLiterals,
);

if (findings.length === 0) {
  console.log("✓ No queda texto en español escrito a mano en los componentes.");
  process.exit(0);
}

const byFile = new Map<string, Finding[]>();
for (const finding of findings) {
  byFile.set(finding.file, [...(byFile.get(finding.file) ?? []), finding]);
}

console.error(
  `✗ ${findings.length} literales en español en ${byFile.size} archivos:\n`,
);
for (const [file, items] of [...byFile].sort()) {
  console.error(`  ${file}  (${items.length})`);
  for (const item of items.slice(0, 3)) {
    console.error(`    ${item.line}: ${item.text.slice(0, 90)}`);
  }
  if (items.length > 3) console.error(`    … y ${items.length - 3} más`);
}

process.exit(1);
