import { describe, expect, it, vi } from "vitest";
import { LruCache } from "./LruCache";

describe("LruCache", () => {
  it("calcula una sola vez lo mismo, aunque lo pidan dos a la vez", async () => {
    const cache = new LruCache<string>(10);
    const create = vi.fn(async () => "banner");

    const [a, b] = await Promise.all([
      cache.getOrCreate("es|ancho|k3x9", create),
      cache.getOrCreate("es|ancho|k3x9", create),
    ]);

    expect([a, b]).toEqual(["banner", "banner"]);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("al llenarse saca la que lleva más tiempo sin usarse", async () => {
    const cache = new LruCache<string>(2);
    const create = vi.fn(async (key: string) => key);

    await cache.getOrCreate("a", () => create("a"));
    await cache.getOrCreate("b", () => create("b"));
    await cache.getOrCreate("a", () => create("a"));
    await cache.getOrCreate("c", () => create("c"));
    await cache.getOrCreate("a", () => create("a"));
    await cache.getOrCreate("b", () => create("b"));

    /* «a» se usó después de «b», así que al entrar «c» salió «b», y hubo que volver a calcularla. */
    expect(create.mock.calls.map(([key]) => key)).toEqual(["a", "b", "c", "b"]);
    expect(cache.size).toBe(2);
  });

  it("un fallo no se queda guardado: la siguiente vez se reintenta", async () => {
    const cache = new LruCache<string>(10);
    const create = vi
      .fn<[], Promise<string>>()
      .mockRejectedValueOnce(new Error("Firebase no respondió"))
      .mockResolvedValueOnce("foto");

    await expect(cache.getOrCreate("foto.webp", create)).rejects.toThrow(
      "Firebase no respondió",
    );
    await expect(cache.getOrCreate("foto.webp", create)).resolves.toBe("foto");
  });

  it("get no calcula nada: devuelve lo guardado o nada", async () => {
    const cache = new LruCache<string>(10);

    expect(cache.get("es|ancho|k3x9")).toBeUndefined();
    await cache.getOrCreate("es|ancho|k3x9", async () => "banner");
    await expect(cache.get("es|ancho|k3x9")).resolves.toBe("banner");
  });
});
