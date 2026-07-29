import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAdmin } from "./isAdmin";

describe("isAdmin", () => {
  const original = process.env.HAZLO_SANO_ADMIN_EMAILS;

  beforeEach(() => {
    process.env.HAZLO_SANO_ADMIN_EMAILS =
      "admin@hazlosano.com, Owner@Hazlosano.com";
  });

  afterEach(() => {
    process.env.HAZLO_SANO_ADMIN_EMAILS = original;
  });

  it("returns true for a listed email (case-insensitive)", () => {
    expect(isAdmin("admin@hazlosano.com")).toBe(true);
    expect(isAdmin("ADMIN@hazlosano.com")).toBe(true);
    expect(isAdmin("owner@hazlosano.com")).toBe(true);
  });

  it("returns false for a non-listed email", () => {
    expect(isAdmin("someone@gmail.com")).toBe(false);
  });

  it("returns false for empty/undefined email", () => {
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin("")).toBe(false);
  });

  it("returns false when no admins are configured", () => {
    process.env.HAZLO_SANO_ADMIN_EMAILS = "";
    expect(isAdmin("admin@hazlosano.com")).toBe(false);
  });
});
