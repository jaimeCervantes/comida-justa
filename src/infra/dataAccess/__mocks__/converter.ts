import { faker } from "@faker-js/faker";
import { vi } from "vitest";

export const getCollectionWithConverter = vi.fn(() => {
  return {
    get: vi.fn(() => {
      return {
        docs: [
          {
            data: vi.fn(() => {
              return {
                id: faker.string.uuid(),
                title: faker.lorem.words(5),
                description: faker.lorem.words(10),
                price: faker.number.int(100),
                // faker 9 retiró `image.imageUrl()`; el sustituto es `image.url()`.
                file: faker.image.url(),
                user: {
                  id: faker.string.uuid(),
                  email: faker.internet.email(),
                  displayName: faker.person.fullName(),
                  phoneNumber: faker.phone.number(),
                  // y `internet.avatar()` se mudó a `image.avatar()`.
                  photoURL: faker.image.avatar(),
                },
              };
            }),
          },
        ],
      };
    }),
    add: vi.fn(() => {
      return {
        id: faker.string.uuid(),
      };
    }),
    where: vi.fn(() => {
      return {
        get: vi.fn(() => ({
          query: {},
          docs: [],
          empty: true,
        })),
      };
    }),
  };
});
