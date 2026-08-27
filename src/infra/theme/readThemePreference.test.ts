import { describe, expect, it, vi } from "vitest";

const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));

import { readThemePreference } from "./readThemePreference";

describe("readThemePreference", () => {
  it("lee la cookie cuando hay una preferencia guardada", async () => {
    getCookie.mockReturnValue({ value: "dark" });

    expect(await readThemePreference()).toBe("dark");
  });

  it("null sin cookie: es cuando el sitio sigue al sistema", async () => {
    getCookie.mockReturnValue(undefined);

    expect(await readThemePreference()).toBeNull();
  });
});
