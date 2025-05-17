import { faker } from "@faker-js/faker";
import { Timestamp } from "firebase-admin/firestore";
import type { Post } from "~/infrastructure/types/Posts";

export const posts: Post[] = [
  {
    id: faker.string.uuid(),
    title: faker.lorem.words(5),
    description: faker.lorem.words(10),
    price: faker.number.int(100),
    media: {
      type: "image",
      url: faker.image.url(),
      alt: faker.lorem.words(3),
    },
    createdAt: Timestamp.fromDate(faker.date.past()),
    user: {
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      photoURL: faker.image.avatar(),
    },
  },
  {
    id: faker.string.uuid(),
    title: faker.lorem.words(5),
    description: faker.lorem.words(10),
    price: faker.number.int(100),
    media: {
      type: "image",
      url: faker.image.url(),
      alt: faker.lorem.words(3),
    },
    createdAt: Timestamp.fromDate(faker.date.past()),
    user: {
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      photoURL: faker.image.avatar(),
    },
  },
];
