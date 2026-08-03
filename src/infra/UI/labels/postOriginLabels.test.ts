import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import {
  ORIGIN_LABEL_KEYS,
  ORIGIN_QUESTION_KEYS,
  originLabelKey,
  originOptionsFor,
} from "./postOriginLabels";

describe("etiquetas de procedencia", () => {
  it("nombra a la procedencia sin especificar", () => {
    expect(originLabelKey(null)).toBe("origin.unspecified");
    expect(originLabelKey("productor")).toBe("origin.productor");
  });

  /*
   * Dos redacciones para el mismo valor, y son dos actos de habla distintos: en el reporte la
   * procedencia es un nombre ("Reventa lejana") y en el formulario es una pregunta sobre lo suyo
   * ("Lo traigo de muy lejos"). Si alguien las unificara, este test lo dice.
   */
  it("distingue el nombre de la pregunta", () => {
    expect(es.vocabulary.origin.reventa_lejana).toBe("Reventa lejana");
    expect(es.vocabulary.originQuestion.reventa_lejana).toBe(
      "Lo traigo de muy lejos",
    );
  });

  it("tiene texto en el catálogo para las dos redacciones de cada procedencia", () => {
    const origins = Object.keys(ORIGIN_LABEL_KEYS) as Array<
      keyof typeof ORIGIN_LABEL_KEYS
    >;

    for (const origin of origins) {
      expect(es.vocabulary.origin[origin]).toBeTruthy();
      expect(es.vocabulary.originQuestion[origin]).toBeTruthy();
      expect(ORIGIN_QUESTION_KEYS[origin]).toBe(`originQuestion.${origin}`);
    }
  });

  describe("originOptionsFor", () => {
    it("le ofrece al vendedor las tres que puede afirmar de lo suyo", () => {
      expect(originOptionsFor(false).map((option) => option.value)).toEqual([
        "productor",
        "reventa_cercana",
        "reventa_lejana",
      ]);
    });

    /* El ámbito del productor lo decide la distancia; preguntárselo sería invitarlo a mentir. */
    it("nunca le pregunta al vendedor qué tan lejos produce", () => {
      const offered = originOptionsFor(false).map((option) => option.value);

      expect(offered).not.toContain("productor_local");
      expect(offered).not.toContain("productor_foraneo");
    });

    it("le deja al admin las cinco, incluidas las de Hazlo Sano", () => {
      const offered = originOptionsFor(true).map((option) => option.value);

      expect(offered).toHaveLength(5);
      expect(offered).toContain("hazlo_sano_propio");
      expect(offered).toContain("hazlo_sano_reventa");
    });

    it("pregunta con la redacción del vendedor, no con la del reporte", () => {
      const [productor] = originOptionsFor(false);

      expect(productor.labelKey).toBe("originQuestion.productor");
      expect(es.vocabulary.originQuestion.productor).toBe(
        "Yo lo hago o lo cultivo",
      );
    });
  });
});
