import { describe, expect, it } from "vitest";
import type { FollowTarget } from "~/domain/follow/follow";
import type IFollowRepository from "./ports/IFollowRepository";
import ToggleFollowUseCase from "./toggleFollowUseCase";

const YO = "H3ucMRnM2ZtD4ezH5tPx";
const TIENDA = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";

function keyOf(target: FollowTarget): string {
  return target.kind === "seller"
    ? `s:${target.sellerId}`
    : `u:${target.userId}`;
}

/**
 * Guarda pares como los guardaría la base: un `Set`, así que seguir dos veces deja **una** entrada.
 * Es el mismo efecto que los dos índices únicos parciales de la migración `0031`, y por eso el
 * caso de uso no comprueba antes de escribir.
 */
class FakeFollows implements IFollowRepository {
  readonly rows = new Set<string>();

  async follow(followerId: string, target: FollowTarget): Promise<void> {
    this.rows.add(`${followerId}|${keyOf(target)}`);
  }

  async unfollow(followerId: string, target: FollowTarget): Promise<void> {
    this.rows.delete(`${followerId}|${keyOf(target)}`);
  }

  async countFollowers(target: FollowTarget): Promise<number> {
    const suffix = `|${keyOf(target)}`;

    return [...this.rows].filter((row) => row.endsWith(suffix)).length;
  }

  async isFollowing(
    followerId: string | null,
    target: FollowTarget,
  ): Promise<boolean> {
    return (
      followerId !== null && this.rows.has(`${followerId}|${keyOf(target)}`)
    );
  }
}

describe("ToggleFollowUseCase", () => {
  it("sigue una tienda que no seguía, y devuelve el contador ya al día", async () => {
    const follows = new FakeFollows();

    const result = await new ToggleFollowUseCase(follows).execute({
      followerId: YO,
      sellerId: TIENDA,
    });

    expect(result).toEqual({ ok: true, following: true, followers: 1 });
  });

  it("y al repetir la intención deja de seguirla", async () => {
    const follows = new FakeFollows();
    const useCase = new ToggleFollowUseCase(follows);

    await useCase.execute({ followerId: YO, sellerId: TIENDA });
    const result = await useCase.execute({ followerId: YO, sellerId: TIENDA });

    expect(result).toEqual({ ok: true, following: false, followers: 0 });
    expect(follows.rows.size).toBe(0);
  });

  /* El botón manda una intención, no un estado: si mandara "ahora quiero seguir", dos pestañas con
     vistas distintas se pisarían. Aquí se lee lo que hay y se hace lo contrario. */
  it("decide por lo que hay guardado, no por lo que crea la pantalla", async () => {
    const follows = new FakeFollows();
    await follows.follow(YO, { kind: "seller", sellerId: TIENDA });

    const result = await new ToggleFollowUseCase(follows).execute({
      followerId: YO,
      sellerId: TIENDA,
    });

    expect(result).toEqual({ ok: true, following: false, followers: 0 });
  });

  it("sigue a una persona sin tocar el destino de tienda", async () => {
    const follows = new FakeFollows();

    await new ToggleFollowUseCase(follows).execute({
      followerId: YO,
      followedId: "44pZIIJ5w1vSYkDQ6gfb",
    });

    expect(
      await follows.countFollowers({ kind: "seller", sellerId: TIENDA }),
    ).toBe(0);
  });

  it.each([
    ["sin destino", {}, "no-target"],
    ["con los dos", { sellerId: TIENDA, followedId: "otra" }, "two-targets"],
    ["a uno mismo", { followedId: YO }, "self"],
  ])("rechaza %s y no escribe nada", async (_caso, destino, reason) => {
    const follows = new FakeFollows();

    const result = await new ToggleFollowUseCase(follows).execute({
      followerId: YO,
      ...destino,
    });

    expect(result).toEqual({ ok: false, reason });
    expect(follows.rows.size).toBe(0);
  });
});
