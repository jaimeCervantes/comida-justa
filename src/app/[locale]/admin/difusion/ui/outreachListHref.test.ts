import { describe, expect, it } from "vitest";
import { outreachListHref, readOutreachListParams } from "./outreachListHref";

describe("outreachListHref", () => {
  it("lleva lo buscado y la página en la dirección", () => {
    expect(
      outreachListHref("/admin/difusion/grupos", { term: "orizaba", page: 2 }),
    ).toEqual({
      pathname: "/admin/difusion/grupos",
      query: { q: "orizaba", pagina: "2" },
    });
  });

  it("sin búsqueda ni página, la dirección limpia", () => {
    expect(outreachListHref("/admin/difusion", { term: "", page: 1 })).toEqual({
      pathname: "/admin/difusion",
      query: {},
    });
  });
});

describe("readOutreachListParams", () => {
  it("lee lo buscado, recortado, y la página", () => {
    expect(readOutreachListParams({ q: "  orizaba ", pagina: "2" })).toEqual({
      term: "orizaba",
      page: 2,
    });
  });

  it("lo que no es una página se vuelve la primera", () => {
    expect(readOutreachListParams({ pagina: "dos" }).page).toBe(1);
    expect(readOutreachListParams({ pagina: ["2", "3"] }).page).toBe(1);
    expect(readOutreachListParams({}).term).toBe("");
  });
});
