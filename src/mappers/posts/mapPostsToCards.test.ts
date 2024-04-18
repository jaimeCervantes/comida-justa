import { expect } from "vitest";
import { posts } from "./dummies/firestorePostDummies";
import { mapPostsToCards } from "./mapPostsToCards";

describe("When mapPostsToIndex receive a list of FirestorePost", () => {
  it("should map them to a list of post for the index cards", () => {
    const mapped = mapPostsToCards(posts);

    expect(mapped).toHaveLength(2);
    expect(mapped).toHaveProperty("0.image");
    expect(mapped).toHaveProperty("0.image.src", posts[0].image);
    expect(mapped).toHaveProperty("0.image.alt", posts[0].title);
    expect(mapped).toHaveProperty("0.createdAt", posts[0].createdAt?.toDate());
    expect(mapped).toHaveProperty("0.createdAtLocale");
  });
});
