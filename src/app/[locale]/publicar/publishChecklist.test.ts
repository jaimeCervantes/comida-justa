import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EMPTY_PUBLISH_DRAFT,
  type PublishDraft,
  publishBlockingCount,
  publishChecklist,
  publishRequiresPrice,
  publishShowsPrice,
} from "./publishChecklist";
import { stepForField } from "./publishSteps";

const draft = (patch: Partial<PublishDraft>): PublishDraft => ({
  ...EMPTY_PUBLISH_DRAFT,
  ...patch,
});

const itemFor = (state: PublishDraft, id: string) => {
  const found = publishChecklist(state).find((item) => item.id === id);
  if (!found) throw new Error(`no hay punto «${id}» en el checklist`);
  return found;
};

describe("publishChecklist", () => {
  it("empieza con todo pendiente, y solo la foto es opcional", () => {
    const items = publishChecklist(EMPTY_PUBLISH_DRAFT);

    expect(items.every((item) => !item.done)).toBe(true);
    expect(
      items.filter((item) => item.optional).map((item) => item.id),
    ).toEqual(["media"]);
  });

  it("da por hecho el título de un anuncio sin pedirle precio", () => {
    const state = draft({ kind: "anuncio", title: "Taller de compostaje" });

    expect(itemFor(state, "essentials").done).toBe(true);
    expect(itemFor(state, "essentials").labelKey).toBe("checkTitle");
  });

  it("a un producto le pide título y precio, y lo dice en el rótulo", () => {
    const conTitulo = draft({ kind: "producto", title: "Miel de azahar" });

    expect(itemFor(conTitulo, "essentials").labelKey).toBe(
      "checkTitleAndPrice",
    );
    expect(itemFor(conTitulo, "essentials").done).toBe(false);
    expect(itemFor({ ...conTitulo, price: "180" }, "essentials").done).toBe(
      true,
    );
  });

  it("no acepta espacios en blanco como respuesta", () => {
    expect(itemFor(draft({ title: "   " }), "essentials").done).toBe(false);
    expect(itemFor(draft({ content: "\n\t" }), "content").done).toBe(false);
  });

  it("cierra la foto con un archivo y el contacto con el teléfono", () => {
    expect(itemFor(draft({ mediaCount: 1 }), "media").done).toBe(true);
    expect(itemFor(draft({ phone: "5512345678" }), "contact").done).toBe(true);
  });

  /**
   * Lo que decide si «Publicar» va a fallar. La foto queda fuera aposta: es lo que permite que el
   * contador llegue a cero para quien publica sin ella.
   */
  it("no cuenta la foto entre lo que bloquea", () => {
    const completo = draft({
      kind: "anuncio",
      title: "Taller de compostaje",
      category: "alimentacion",
      content: "Nos vemos el sábado en el parque.",
      phone: "5512345678",
    });

    expect(publishBlockingCount(publishChecklist(completo))).toBe(0);
    expect(publishChecklist(completo).some((item) => !item.done)).toBe(true);
  });
});

describe("los atajos del checklist", () => {
  /**
   * Cada punto lleva a un campo, y ese campo tiene que vivir en algún paso: si no, pulsarlo no
   * llevaría a ninguna parte y el checklist pasaría de atajo a adorno.
   */
  it("apunta a campos que algún paso declara", () => {
    for (const item of publishChecklist(EMPTY_PUBLISH_DRAFT)) {
      expect(stepForField(item.field), `punto «${item.id}»`).not.toBeNull();
    }
  });
});

describe("la regla del precio", () => {
  /**
   * Se lee del formulario, no se copia: es la única forma de que el checklist no pida un precio que
   * la pantalla no exige. Si mañana un evento pasa a exigirlo, esta prueba se pone roja aquí y no en
   * el envío de alguien.
   */
  const source = readFileSync(join(__dirname, "PublishForm.tsx"), "utf8");

  it("es la misma que aplica el formulario", () => {
    expect(source).toContain("publishRequiresPrice(kind)");
    expect(source).toContain("publishShowsPrice(kind)");
  });

  it("exige precio a lo que se vende y no a lo que se anuncia", () => {
    expect(publishRequiresPrice("producto")).toBe(true);
    expect(publishRequiresPrice("servicio")).toBe(true);
    expect(publishRequiresPrice("evento")).toBe(false);
    expect(publishRequiresPrice("anuncio")).toBe(false);
  });

  it("enseña el campo a un evento aunque pueda ser gratis", () => {
    expect(publishShowsPrice("evento")).toBe(true);
    expect(publishShowsPrice("anuncio")).toBe(false);
  });
});
