/**
 * Comprueba que `"use client"` y `"use server"` sigan siendo directivas.
 *
 * Una directiva solo cuenta como tal si es la **primera sentencia** del archivo. Si un import se
 * cuela por encima, deja de serlo: pasa a ser una expresión suelta —Biome incluso la reescribe
 * como `("use server")`— y el módulo pierde su límite. Un `actions.ts` así deja de ser una Server
 * Action, y cualquier Client Component que lo importe se lleva al navegador todo lo que ese
 * archivo arrastre: la sesión, la conexión a la base, el driver de Postgres.
 *
 * Lo peligroso es que el cambio es **silencioso**. Sigue siendo TypeScript válido, así que
 * `typecheck` pasa; las pruebas unitarias mockean la infraestructura, así que tampoco lo ven. Solo
 * lo descubre el bundler, en `pnpm run build` o en la e2e. Esto lo adelanta a un grep instantáneo.
 *
 * Uso: `pnpm run check:directives`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["src"];
const DIRECTIVE = /^\s*\(?["'](use client|use server)["']\)?\s*;?\s*$/;

type Finding = { file: string; line: number; text: string; reason: string };

/**
 * Devuelve el índice de la primera línea que es código de verdad: ni vacía, ni comentario.
 *
 * Los comentarios sí pueden ir antes de una directiva —no son sentencias—, así que saltarlos es
 * parte de la regla, no una concesión.
 */
function firstStatementIndex(lines: string[]): number {
  let inBlockComment = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();

    if (inBlockComment) {
      if (line.includes("*/")) inBlockComment = false;
      continue;
    }
    if (line === "" || line.startsWith("//")) continue;
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlockComment = true;
      continue;
    }

    return index;
  }

  return -1;
}

function checkFile(file: string): Finding[] {
  const lines = readFileSync(file, "utf8").split("\n");
  const first = firstStatementIndex(lines);
  const relativePath = relative(process.cwd(), file).replace(/\\/g, "/");

  return lines.flatMap((line, index) => {
    const match = line.match(DIRECTIVE);

    /* Solo se miran las de nivel de módulo. Una directiva indentada está dentro de una función
       —`auth-buttons/index.tsx` declara acciones en línea así— y eso es legal. */
    if (!match || line !== line.trimStart()) return [];

    const finding = { file: relativePath, line: index + 1, text: line.trim() };

    if (line.trim().startsWith("(")) {
      return [
        {
          ...finding,
          reason:
            "está entre paréntesis: es una expresión, ya no una directiva",
        },
      ];
    }

    if (index !== first) {
      return [
        {
          ...finding,
          reason: `no es la primera sentencia (esa está en la línea ${first + 1})`,
        },
      ];
    }

    return [];
  });
}

function collectFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      collectFiles(path, found);
      continue;
    }
    if (/\.tsx?$/.test(path)) found.push(path);
  }

  return found;
}

const findings = ROOTS.flatMap((root) => collectFiles(root)).flatMap(checkFile);

if (findings.length === 0) {
  console.log("✓ Todas las directivas siguen siendo la primera sentencia.");
  process.exit(0);
}

console.error(`✗ ${findings.length} directiva(s) rota(s):\n`);
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line}  ${finding.text}`);
  console.error(`    ${finding.reason}\n`);
}
console.error(
  "Una directiva solo cuenta si es la primera sentencia del archivo. Súbela al principio.",
);

process.exit(1);
