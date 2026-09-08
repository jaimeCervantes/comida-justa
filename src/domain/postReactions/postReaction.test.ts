import { describe, expect, it } from "vitest";
import {
  isPostReactionIntent,
  rejectPostReactionRequest,
} from "./postReaction";

describe("post reactions", () => {
  it.each([
    ["support", true],
    ["withdraw", true],
    ["like", false],
    ["", false],
    [null, false],
  ])("reconoce la intención %s", (intent, accepted) => {
    expect(isPostReactionIntent(intent)).toBe(accepted);
  });

  it.each([
    ["no-user", null, { id: "post-1", kind: "practica" }, "support"],
    ["not-found", "luis", null, "support"],
    ["invalid-intent", "luis", { id: "post-1", kind: "practica" }, "downvote"],
  ])("rechaza %s", (reason, userId, post, intent) => {
    expect(rejectPostReactionRequest({ userId, post, intent })).toBe(reason);
  });

  it.each(["practica", "producto", "evento", "servicio", "anuncio"])(
    "acepta una reacción de apoyo sobre una publicación %s",
    (kind) => {
      expect(
        rejectPostReactionRequest({
          userId: "luis",
          post: { id: "post-1", kind },
          intent: "support",
        }),
      ).toBeNull();
    },
  );

  it("acepta retirar una reacción de una publicación existente", () => {
    expect(
      rejectPostReactionRequest({
        userId: "luis",
        post: { id: "post-1", kind: "producto" },
        intent: "withdraw",
      }),
    ).toBeNull();
  });
});
