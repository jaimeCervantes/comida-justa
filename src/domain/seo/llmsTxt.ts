import { buildMetaDescription } from "./description";
import { absoluteUrl } from "./url";

export interface LlmsEntry {
  title: string;
  path: string;
  /** El texto del que se saca el resumen de una línea. Opcional: una tienda puede no tener. */
  summary?: string | null;
}

export interface LlmsSection {
  heading: string;
  entries: readonly LlmsEntry[];
}

export interface LlmsTxtInput {
  baseUrl: string;
  brandName: string;
  /** La frase que dice qué es el sitio. Va en la cita, que es lo primero que se lee. */
  description: string;
  sections: readonly LlmsSection[];
}

/** Un resumen de una línea: sin saltos, sin cortar palabras y corto de verdad. */
const SUMMARY_LENGTH = 120;

/**
 * El índice del sitio en texto plano, siguiendo la convención `llms.txt`.
 *
 * **Con una advertencia escrita a propósito:** hoy no hay constancia de que ningún asistente grande
 * lo consuma. Se publica porque cuesta poco y no estorba, no porque vaya a mover algo por sí solo;
 * lo que de verdad leen los asistentes son los datos estructurados del slice 4 y el texto de las
 * páginas. Si algún día el formato se abandona, borrar la ruta no rompe nada.
 *
 * El formato es markdown a propósito: es lo que un modelo lee mejor y lo que la convención pide —
 * un `#` con el nombre, una cita con la descripción, y una lista de enlaces por sección.
 */
export function buildLlmsTxt({
  baseUrl,
  brandName,
  description,
  sections,
}: LlmsTxtInput): string {
  const lines: string[] = [`# ${brandName}`, "", `> ${description}`, ""];

  for (const section of sections) {
    if (section.entries.length === 0) continue;

    lines.push(`## ${section.heading}`, "");

    for (const entry of section.entries) {
      const url = absoluteUrl(baseUrl, entry.path);
      const summary = entry.summary
        ? `: ${buildMetaDescription(entry.summary, SUMMARY_LENGTH)}`
        : "";

      lines.push(`- [${entry.title}](${url})${summary}`);
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
