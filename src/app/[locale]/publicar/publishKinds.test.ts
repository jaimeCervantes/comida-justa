import { describe, expect, it } from "vitest";
import { DEFAULT_POST_KIND, POST_KINDS } from "~/domain/entities/post/kind";
import {
  OFFERED_KINDS,
  PUBLISH_KIND_OPTIONS,
  publishKindTestId,
} from "./publishKinds";

describe("Los tipos que ofrece /publicar", () => {
  /**
   * Un tipo que existe en el dominio y no se ofrece es un tipo que **nadie puede publicar**: la
   * validación lo aceptaría, las consultas lo filtrarían, y la única forma de crear uno sería por
   * la base. Al revés es peor todavía: una píldora que guarda un tipo que `isValidKind` rechaza.
   */
  it("son exactamente los del dominio", () => {
    expect([...OFFERED_KINDS].sort()).toEqual([...POST_KINDS].sort());
  });

  it("no repite ninguno", () => {
    expect(new Set(OFFERED_KINDS).size).toBe(OFFERED_KINDS.length);
  });

  /**
   * El orden **no** es el del dominio, y esta prueba es lo que lo deja escrito: si mañana alguien
   * reordena `POST_KINDS`, esto no se mueve, y si alguien reordena estas opciones sabrá que estaba
   * decidido y no heredado.
   */
  it("empieza por lo que se vende y deja el anuncio al final", () => {
    expect(OFFERED_KINDS[0]).toBe("producto");
    expect(OFFERED_KINDS.at(-1)).toBe(DEFAULT_POST_KIND);
  });

  it("da a cada uno un identificador propio para las pruebas", () => {
    const ids = OFFERED_KINDS.map(publishKindTestId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(publishKindTestId("producto")).toBe("publish-kind-producto");
  });

  it("nombra cada rótulo con una clave entera, grepeable", () => {
    for (const option of PUBLISH_KIND_OPTIONS) {
      expect(option.labelKey).toMatch(/^kind[A-Z]/);
    }
  });
});
