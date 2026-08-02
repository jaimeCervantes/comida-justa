import type { JsonLdNode } from "~/domain/seo/jsonLd/types";

/**
 * Serializa el JSON-LD para meterlo en un `<script>`.
 *
 * **El `<` se escapa siempre.** El texto de una publicación lo escribe la comunidad, y basta con
 * que alguien teclee `</script>` en la descripción de un producto para cerrar la etiqueta antes de
 * tiempo y dejar el resto como HTML ejecutable. `<` es JSON válido y el analizador lo lee
 * igual, así que no cuesta nada.
 */
export function serializeJsonLd(nodes: readonly JsonLdNode[]): string {
  const payload = nodes.length === 1 ? nodes[0] : nodes;

  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/** Emite uno o varios nodos de JSON-LD. No pinta nada. */
export default function JsonLd({
  data,
}: {
  data: JsonLdNode | readonly JsonLdNode[];
}) {
  const nodes = Array.isArray(data) ? data : [data as JsonLdNode];

  if (nodes.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: es la única forma de emitir JSON-LD; el contenido va escapado en `serializeJsonLd`.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(nodes) }}
    />
  );
}
