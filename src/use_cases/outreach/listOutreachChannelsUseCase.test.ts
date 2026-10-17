import { describe, expect, it } from "vitest";
import InMemoryOutreachChannelRepository from "./__fakes__/InMemoryOutreachChannelRepository";
import { grupo } from "./__fakes__/masaMadreWorld";
import ListOutreachChannelsUseCase, {
  OUTREACH_LIST_PAGE_SIZE,
} from "./listOutreachChannelsUseCase";

async function groups(...names: string[]) {
  const repository = new InMemoryOutreachChannelRepository();
  for (const name of names) await repository.create(grupo(name, "post"));

  return new ListOutreachChannelsUseCase(repository);
}

/** Slice 9 de `difusionEnGrupos.feature`: la lista de grupos se busca y se pagina. */
describe("ListOutreachChannelsUseCase", () => {
  it("busca por nombre, sin acentos ni mayúsculas", async () => {
    const list = await groups(
      "Mamás de Orizaba",
      "Emprendedores de Orizaba",
      "Ventas Córdoba",
    );

    const page = await list.execute({ term: "MAMAS", page: 1 });

    expect(page.items.map((channel) => channel.name)).toEqual([
      "Mamás de Orizaba",
    ]);
    expect(page.total).toBe(1);
  });

  it("también por su dirección", async () => {
    const list = await groups("Mamás de Orizaba", "Ventas Córdoba");

    const page = await list.execute({ term: "ventascórdoba", page: 1 });

    expect(page.items.map((channel) => channel.name)).toEqual([
      "Ventas Córdoba",
    ]);
  });

  it("de veinte en veinte, en orden por nombre", async () => {
    const names = Array.from(
      { length: 25 },
      (_, index) => `Orizaba ${String(index + 1).padStart(2, "0")}`,
    );
    const list = await groups(...names);

    const second = await list.execute({ term: "orizaba", page: 2 });

    expect(OUTREACH_LIST_PAGE_SIZE).toBe(20);
    expect(second.total).toBe(25);
    expect(second.page).toBe(2);
    expect(second.items.map((channel) => channel.name)).toEqual(
      names.slice(20),
    );
  });
});
