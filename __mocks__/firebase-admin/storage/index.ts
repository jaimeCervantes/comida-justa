import { vi } from "vitest";

export const getStorage = vi.fn(() => {
  return {
    bucket: vi.fn(() => {
      return {
        file: vi.fn(() => {
          return {
            createWriteStream: vi.fn(() => {
              return {
                on: vi.fn(),
                end: vi.fn(),
              };
            }),
            save: vi.fn(() => {
              return Promise.resolve(true);
            }),
          };
        }),
      };
    }),
  };
});
export const getDownloadURL = vi.fn()