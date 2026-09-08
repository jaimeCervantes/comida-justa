import { describe, expect, it } from "vitest";
import {
  isPracticePostReactionIntent,
  rejectPracticePostReactionRequest,
} from "./practicePostReaction";

describe("practice post reactions", () => {
  it.each([
    ["support", true],
    ["withdraw", true],
    ["like", false],
    ["", false],
    [null, false],
  ])("reconoce la intención %s", (intent, accepted) => {
    expect(isPracticePostReactionIntent(intent)).toBe(accepted);
  });

  it.each([
    ["no-user", null, { id: "post-1", kind: "practica" }, "support"],
    ["not-found", "luis", null, "support"],
    ["not-practice", "luis", { id: "post-1", kind: "producto" }, "support"],
    ["invalid-intent", "luis", { id: "post-1", kind: "practica" }, "downvote"],
  ])("rechaza %s", (reason, userId, post, intent) => {
    expect(rejectPracticePostReactionRequest({ userId, post, intent })).toBe(
      reason,
    );
  });

  it("acepta una reacción de apoyo sobre una publicación de práctica", () => {
    expect(
      rejectPracticePostReactionRequest({
        userId: "luis",
        post: { id: "post-1", kind: "practica" },
        intent: "support",
      }),
    ).toBeNull();
  });
});
