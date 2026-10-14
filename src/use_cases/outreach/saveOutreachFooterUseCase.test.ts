import { describe, expect, it } from "vitest";
import InMemoryOutreachFooterRepository from "./__fakes__/InMemoryOutreachFooterRepository";
import SaveOutreachFooterUseCase from "./saveOutreachFooterUseCase";

function setup() {
  const footers = new InMemoryOutreachFooterRepository();

  return { footers, useCase: new SaveOutreachFooterUseCase(footers) };
}

describe("SaveOutreachFooterUseCase", () => {
  it("da de alta el pie ya limpio", async () => {
    const { footers, useCase } = setup();

    const result = await useCase.execute({
      draft: { name: " Hazlo Sano ", body: "📲 Pedidos WhatsApp\r\n" },
    });

    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    expect(footers.saved.get(result.id)).toEqual({
      name: "Hazlo Sano",
      body: "📲 Pedidos WhatsApp",
    });
  });

  it("con identidad corrige el que ya existe", async () => {
    const { footers, useCase } = setup();
    const id = await footers.create({ name: "Hazlo Sano", body: "Viejo" });

    expect(
      await useCase.execute({
        id,
        draft: { name: "Hazlo Sano", body: "Nuevo" },
      }),
    ).toEqual({ status: "saved", id });
    expect(footers.saved.get(id)?.body).toBe("Nuevo");
  });

  it("no guarda nada si falta algo, y dice qué", async () => {
    const { footers, useCase } = setup();

    expect(await useCase.execute({ draft: { name: "", body: "" } })).toEqual({
      status: "invalid",
      errors: { name: "required", body: "required" },
    });
    expect(footers.saved.size).toBe(0);
  });

  it("avisa si el pie que se corregía ya no existe", async () => {
    const { useCase } = setup();

    expect(
      await useCase.execute({
        id: "pie-borrado",
        draft: { name: "Hazlo Sano", body: "Algo" },
      }),
    ).toEqual({ status: "not-found" });
  });
});
