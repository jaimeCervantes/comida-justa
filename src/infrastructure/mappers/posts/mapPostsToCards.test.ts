import { expect } from "vitest";
import { posts } from "./dummies/firestorePostDummies";
import { mapPostsToCards } from "./mapPostsToCards";

describe("When mapPostsToIndex receive a list of FirestorePost", () => {
  it("should map them to a list of post for the index cards", () => {
    const mapped = mapPostsToCards(posts);

    expect(mapped).toHaveLength(2);
    expect(mapped).toHaveProperty("0.media");
    expect(mapped).toHaveProperty("0.media.url", posts[0].media.url);
    expect(mapped).toHaveProperty("0.media.alt", posts[0].media.alt);
    expect(mapped).toHaveProperty("0.media.type", posts[0].media.type);
    expect(mapped).toHaveProperty("0.createdAt", posts[0].createdAt?.toDate());
    expect(mapped).toHaveProperty("0.createdAtLocale");
  });
});
