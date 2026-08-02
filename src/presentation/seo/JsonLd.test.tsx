import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JsonLd, { serializeJsonLd } from "./JsonLd";

describe("serializeJsonLd", () => {
  it("escapa el `<` para que nadie pueda cerrar el script desde una descripción", () => {
    const serialized = serializeJsonLd([
      { "@type": "Product", name: "</script><img onerror=alert(1)>" },
    ]);

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script");
    // Sigue siendo JSON válido: el escape lo entiende el analizador.
    expect(JSON.parse(serialized)).toMatchObject({
      name: "</script><img onerror=alert(1)>",
    });
  });

  it("emite un objeto solo cuando hay un nodo, y un arreglo cuando hay varios", () => {
    expect(serializeJsonLd([{ "@type": "Product" }])).toBe(
      '{"@type":"Product"}',
    );
    expect(
      serializeJsonLd([{ "@type": "Article" }, { "@type": "VideoObject" }]),
    ).toBe('[{"@type":"Article"},{"@type":"VideoObject"}]');
  });
});

describe("JsonLd", () => {
  it("emite el script con el tipo que los buscadores buscan", () => {
    const { container } = render(<JsonLd data={{ "@type": "Person" }} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );

    expect(script?.textContent).toBe('{"@type":"Person"}');
  });

  it("no pinta nada cuando no hay nodos", () => {
    const { container } = render(<JsonLd data={[]} />);

    expect(container.innerHTML).toBe("");
  });
});
