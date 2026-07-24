import { expect } from "vitest";
import { posts } from "./dummies/firestorePostDummies";
import { mapOnePostToCard, mapPostsToCards } from "./mapPostsToCards";

describe("When mapPostsToIndex receive a list of FirestorePost", () => {
  it("should map them to a list of post for the index cards", () => {
    const mapped = mapPostsToCards(posts);

    expect(mapped).toHaveLength(2);
    expect(mapped).toHaveProperty("0.media");
    expect(mapped).toHaveProperty("0.media.url", posts[0].media.url);
    expect(mapped).toHaveProperty("0.media.alt", posts[0].media.alt);
    expect(mapped).toHaveProperty("0.media.type", posts[0].media.type);
  });
});

describe("When a post carries provenance", () => {
  it("should keep kind and origin on the card, so the badge can be derived", () => {
    const card = mapOnePostToCard({
      ...posts[0],
      kind: "producto",
      origin: "hazlo_sano_propio",
    });

    expect(card.kind).toBe("producto");
    expect(card.origin).toBe("hazlo_sano_propio");
  });

  it("should default origin to null when the post has none", () => {
    const card = mapOnePostToCard(posts[0]);

    expect(card.origin).toBeNull();
  });
});
