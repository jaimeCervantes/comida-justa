import { vi } from "vitest";
import { faker } from "@faker-js/faker";

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
                file: faker.image.imageUrl(),
                user: {
                  id: faker.string.uuid(),
                  email: faker.internet.email(),
                  displayName: faker.person.fullName(),
                  phoneNumber: faker.phone.number(),
                  photoURL: faker.internet.avatar(),
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
        }))
      }
    })
  };
});