import { describe, expect, it } from "vitest";
import InMemoryOutreachTextRepository from "./__fakes__/InMemoryOutreachTextRepository";
import ListOutreachTextsUseCase from "./listOutreachTextsUseCase";

function draft(name: string) {
  return { name, opening: "", closing: "", items: [] };
}

describe("ListOutreachTextsUseCase", () => {
  it("busca por nombre, sin acentos ni mayúsculas", async () => {
    const repository = new InMemoryOutreachTextRepository();
    await repository.create(draft("Masa madre"));
    await repository.create(draft("Jugos verdes"));
    await repository.create(draft("Café de olla"));

    const list = new ListOutreachTextsUseCase(repository);

    expect(
      (await list.execute({ term: "masa", page: 1 })).items.map((t) => t.name),
    ).toEqual(["Masa madre"]);
    expect(
      (await list.execute({ term: "CAFE", page: 1 })).items.map((t) => t.name),
    ).toEqual(["Café de olla"]);
  });

  it("sin nada escrito, la primera página de todas", async () => {
    const repository = new InMemoryOutreachTextRepository();
    await repository.create(draft("Masa madre"));

    const page = await new ListOutreachTextsUseCase(repository).execute({
      term: "",
      page: 1,
    });

    expect(page).toMatchObject({ total: 1, page: 1 });
  });
});
