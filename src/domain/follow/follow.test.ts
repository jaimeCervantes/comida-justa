import { describe, expect, it } from "vitest";
import {
  type FollowRejection,
  rejectionFor,
  showsFollowerCount,
  targetOf,
} from "./follow";

const YO = "44pZIIJ5w1vSYkDQ6gfb";
const OTRA = "H3ucMRnM2ZtD4ezH5tPx";
const TIENDA = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";

describe("rejectionFor", () => {
  /* La corrida de escritorio de «Qué destinos admite un seguimiento». La base lo garantiza con
     `num_nonnulls(seller_id, followed_id) = 1`; esto lo dice antes y con una razón entendible. */
  it.each<
    [string, { sellerId?: string; followedId?: string }, FollowRejection | null]
  >([
    ["una tienda", { sellerId: TIENDA }, null],
    ["una persona", { followedId: OTRA }, null],
    ["las dos a la vez", { sellerId: TIENDA, followedId: OTRA }, "two-targets"],
    ["ninguna", {}, "no-target"],
    ["uno mismo", { followedId: YO }, "self"],
  ])("%s", (_caso, destino, esperado) => {
    expect(rejectionFor({ followerId: YO, ...destino })).toBe(esperado);
  });

  /* Seguir la tienda propia NO lo puede impedir la base: el dueño vive en `sellers.user_id`, otra
     tabla, y un CHECK no la puede consultar. Esa mitad la decide la interfaz, que no le ofrece el
     botón al dueño. Queda escrito para que nadie la busque aquí. */
  it("no juzga si la tienda es tuya: eso no lo sabe este módulo", () => {
    expect(rejectionFor({ followerId: YO, sellerId: TIENDA })).toBeNull();
  });

  it.each([null, undefined, ""])("trata %j como destino ausente", (vacio) => {
    expect(rejectionFor({ followerId: YO, sellerId: vacio })).toBe("no-target");
  });
});

describe("targetOf", () => {
  it("distingue los dos destinos", () => {
    expect(targetOf({ followerId: YO, sellerId: TIENDA })).toEqual({
      kind: "seller",
      sellerId: TIENDA,
    });
    expect(targetOf({ followerId: YO, followedId: OTRA })).toEqual({
      kind: "user",
      userId: OTRA,
    });
  });

  it("no devuelve destino cuando el seguimiento no es válido", () => {
    expect(targetOf({ followerId: YO })).toBeNull();
    expect(targetOf({ followerId: YO, followedId: YO })).toBeNull();
  });
});

describe("showsFollowerCount", () => {
  /* Hoy hay una tienda y un perfil reclamado en toda la base: un "0 seguidores" saldría en el 100%
     de las páginas y convertiría una página nueva en una abandonada. */
  it.each([
    [0, false],
    [1, true],
    [2, true],
    [312, true],
  ])("con %i seguidores se enseña: %s", (seguidores, esperado) => {
    expect(showsFollowerCount(seguidores)).toBe(esperado);
  });
});
