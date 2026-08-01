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

const ROOTS = ["src/app", "src/infra/UI"];
const SPANISH = /[áéíóúÁÉÍÓÚñÑ¿¡]/;

/** Archivos cuyo texto no llega a un visitante, o que aún no toca el slice en curso. */
const IGNORED = [
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /[/\\]stories[/\\]/,
  /[/\\]__mocks__[/\\]/,
];

type Finding = { file: string; line: number; text: string };

/**
 * Quita comentarios antes de buscar. Un comentario en español es documentación, no interfaz, y
 * este repo los escribe en español a propósito: sin esto el reporte sería casi todo ruido.
 */
function stripComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

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
  const lines = stripComments(readFileSync(file, "utf8")).split("\n");

  return lines.flatMap((line, index) =>
    SPANISH.test(line)
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
