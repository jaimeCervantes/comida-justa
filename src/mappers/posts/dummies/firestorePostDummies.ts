import { faker } from "@faker-js/faker";
import { Timestamp } from "firebase-admin/firestore";
import type { Post } from "~/types/Posts.d";

export const posts: Post[] = [
  {
    id: faker.string.uuid(),
    title: faker.lorem.words(5),
    description: faker.lorem.words(10),
    price: faker.number.int(100),
    image: faker.image.url(),
    createdAt: Timestamp.fromDate(faker.date.past()),
    user: {
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      photoURL: faker.internet.avatar(),
    },
  },
  {
    id: faker.string.uuid(),
    title: faker.lorem.words(5),
    description: faker.lorem.words(10),
    price: faker.number.int(100),
    image: faker.image.url(),
    createdAt: Timestamp.fromDate(faker.date.past()),
    user: {
      uid: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      phoneNumber: faker.phone.number(),
      photoURL: faker.internet.avatar(),
    },
  },
];
