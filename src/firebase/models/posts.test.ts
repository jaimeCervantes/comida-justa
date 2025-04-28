// @vitest-environment node
import { vi, expect, it, describe } from "vitest";
import { createPost } from "./posts";
import { faker } from "@faker-js/faker";

vi.mock("./converter");
vi.mock("firebase-admin/storage");

describe("createPost", () => {
  it('should receive "postInfo" literal object, an "image" File and the "user" creator', async () => {
    const postInfo = {
      title: faker.lorem.words(5),
      content: faker.lorem.words(10),
      price: faker.number.int(100),
    };
    const fileImage = new File([""], "test.png", { type: "image/png" });
    const user = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      photoURL: faker.image.avatar(),
    };

    const postId = await createPost(postInfo, fileImage, user);

    expect(postId).toBeTruthy();
  });

  it('should throw an error if "postInfo" is falsy (null, undefined, 0, -0, 0n, false, NaN)', async () => {
    const postInfo = null;
    const image = new File([""], "test.png", { type: "image/png" });
    const user = {};
    try {
      await createPost(postInfo, image, user);
    } catch (error) {
      expect(error.message).toContain("debe ser un objeto");
    }
  });

  it('should throw an error if "postInfo" is an Array', async () => {
    const postInfo = ["first", { second: 1 }];
    const image = new File([""], "test.png", { type: "image/png" });
    const user = {};
    try {
      await createPost(postInfo, image, user);
    } catch (error) {
      expect(error.message).toContain("debe ser un objeto");
    }
  });

  it('should throw an error if "file" is falsy (null, undefined, 0, -0, 0n, false, NaN)', async () => {
    const postInfo = {
      title: faker.lorem.words(5),
      content: faker.lorem.words(10),
      price: faker.number.int(100),
    };
    const file = null;
    const user = {};
    try {
      await createPost(postInfo, file, user);
    } catch (error) {
      expect(error.message).toContain("debe ser un File");
    }
  });

  it('should throw an error if "image" is an Array', async () => {
    const file = [];
    const postInfo = {};
    const user = {};
    try {
      await createPost(postInfo, file, user);
    } catch (error) {
      expect(error.message).toContain("debe ser un File");
    }
  });

  it('should throw an error if "user" is falsy (null, undefined, 0, -0, 0n, false, NaN)', async () => {
    const postInfo = {};
    const image = new File([""], "test.png", { type: "image/png" });
    const user = null;
    try {
      await createPost(postInfo, image, user);
    } catch (error) {
      expect(error.message).toContain("debe ser un objeto");
    }
  });

  it('should throw an error if "user" is an Array', async () => {
    const postInfo = {};
    const image = new File([""], "test.png", { type: "image/png" });
    const user = [];
    try {
      await createPost(postInfo, image, user);
    } catch (error) {
      expect(error.message).toContain("debe ser un objeto");
    }
  });
});