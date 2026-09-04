import { describe, expect, it } from "vitest";
import { canManagePost } from "./postPermissions";

const OWNER = "44pZIIJ5w1vSYkDQ6gfb";
const STORE = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";
const SOMEONE_ELSE = "8f2c1d4e-0000-4000-8000-000000000002";
const OTHER_STORE = "7b64db9f-efb0-42f8-864c-573464341602";

const post = { ownerId: OWNER, sellerId: STORE };

describe("canManagePost", () => {
  it("puede quien publicó", () => {
    expect(canManagePost(post, { userId: OWNER, sellerId: null })).toBe(true);
  });

  it("puede el dueño de la tienda aunque lo publicara otra persona", () => {
    expect(canManagePost(post, { userId: SOMEONE_ELSE, sellerId: STORE })).toBe(
      true,
    );
  });

  it("no puede el dueño de otra tienda", () => {
    expect(
      canManagePost(post, { userId: SOMEONE_ELSE, sellerId: OTHER_STORE }),
    ).toBe(false);
  });

  it("no puede quien no es ni una cosa ni la otra", () => {
    expect(canManagePost(post, { userId: SOMEONE_ELSE, sellerId: null })).toBe(
      false,
    );
  });

  /* Una publicación sin tienda no le abre la puerta a nadie por la vía de la tienda: si la sesión
     no tiene tienda, ambos lados serían nulos y `null === null` habría dejado entrar a cualquiera
     que publicara sin tienda a administrar lo de los demás. */
  it("dos nulos no se parecen: sin tienda, la vía de la tienda no existe", () => {
    expect(
      canManagePost(
        { ownerId: OWNER, sellerId: null },
        { userId: SOMEONE_ELSE, sellerId: null },
      ),
    ).toBe(false);
  });
});
