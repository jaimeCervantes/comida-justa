import { describe, expect, it } from "vitest";
import {
  isAdminOnlyOrigin,
  isHazloSanoOrigin,
  isLocalOrigin,
  isValidOrigin,
  resolveOriginForUser,
} from "./origin";

describe("post origin", () => {
  describe("isValidOrigin", () => {
    it("accepts allowlisted values", () => {
      expect(isValidOrigin("hazlo_sano_propio")).toBe(true);
      expect(isValidOrigin("reventa_foranea")).toBe(true);
    });

    it("rejects unknown values and non-strings", () => {
      expect(isValidOrigin("hazlo_sano")).toBe(false);
      expect(isValidOrigin("")).toBe(false);
      expect(isValidOrigin(null)).toBe(false);
      expect(isValidOrigin(undefined)).toBe(false);
      expect(isValidOrigin(123)).toBe(false);
    });
  });

  describe("classification helpers", () => {
    it("detects Hazlo Sano origins", () => {
      expect(isHazloSanoOrigin("hazlo_sano_propio")).toBe(true);
      expect(isHazloSanoOrigin("hazlo_sano_reventa")).toBe(true);
      expect(isHazloSanoOrigin("productor_local")).toBe(false);
      expect(isHazloSanoOrigin(null)).toBe(false);
    });

    it("detects local origins", () => {
      expect(isLocalOrigin("productor_local")).toBe(true);
      expect(isLocalOrigin("reventa_local")).toBe(true);
      expect(isLocalOrigin("productor_foraneo")).toBe(false);
      expect(isLocalOrigin("hazlo_sano_propio")).toBe(false);
    });

    it("treats Hazlo Sano origins as admin-only", () => {
      expect(isAdminOnlyOrigin("hazlo_sano_propio")).toBe(true);
      expect(isAdminOnlyOrigin("productor_local")).toBe(false);
    });
  });

  describe("resolveOriginForUser (server-side defense)", () => {
    it("returns null for empty or invalid input", () => {
      expect(resolveOriginForUser(null, true)).toBeNull();
      expect(resolveOriginForUser("", true)).toBeNull();
      expect(resolveOriginForUser("not_a_real_origin", true)).toBeNull();
    });

    it("lets an admin set a Hazlo Sano origin", () => {
      expect(resolveOriginForUser("hazlo_sano_propio", true)).toBe(
        "hazlo_sano_propio",
      );
    });

    it("ignores a Hazlo Sano origin requested by a non-admin", () => {
      expect(resolveOriginForUser("hazlo_sano_propio", false)).toBeNull();
      expect(resolveOriginForUser("hazlo_sano_reventa", false)).toBeNull();
    });

    it("lets any user set a community origin", () => {
      expect(resolveOriginForUser("productor_local", false)).toBe(
        "productor_local",
      );
      expect(resolveOriginForUser("reventa_foranea", false)).toBe(
        "reventa_foranea",
      );
    });
  });
});
