import { describe, expect, it } from "vitest";
import {
  isAdminOnlyOrigin,
  isHazloSanoOrigin,
  isNearbyResaleOrigin,
  isProducerOrigin,
  isValidOrigin,
  originsForUser,
  resolveOriginForUser,
} from "./origin";

describe("post origin", () => {
  describe("isValidOrigin", () => {
    it("accepts allowlisted values", () => {
      expect(isValidOrigin("hazlo_sano_propio")).toBe(true);
      expect(isValidOrigin("reventa_lejana")).toBe(true);
    });

    it("rejects unknown values and non-strings", () => {
      expect(isValidOrigin("hazlo_sano")).toBe(false);
      expect(isValidOrigin("")).toBe(false);
      expect(isValidOrigin(null)).toBe(false);
      expect(isValidOrigin(undefined)).toBe(false);
      expect(isValidOrigin(123)).toBe(false);
    });

    /* El ámbito del productor se derogó a propósito: lo decide la distancia de su sucursal, no una
       declaración. Que estos dos nombres ya no existan es la garantía de que nadie los reviva. */
    it("no longer knows a declared scope for a producer", () => {
      expect(isValidOrigin("productor_local")).toBe(false);
      expect(isValidOrigin("productor_foraneo")).toBe(false);
    });
  });

  describe("classification helpers", () => {
    it("detects Hazlo Sano origins", () => {
      expect(isHazloSanoOrigin("hazlo_sano_propio")).toBe(true);
      expect(isHazloSanoOrigin("hazlo_sano_reventa")).toBe(true);
      expect(isHazloSanoOrigin("productor")).toBe(false);
      expect(isHazloSanoOrigin(null)).toBe(false);
    });

    /* La mitad del filtro del directorio que sí vive en el post. La otra —la distancia— vive en la
       sucursal de su tienda, y por eso no se puede contestar desde aquí. */
    it("detects who makes what they sell, and only that", () => {
      expect(isProducerOrigin("productor")).toBe(true);
      expect(isProducerOrigin("reventa_cercana")).toBe(false);
      expect(isProducerOrigin("hazlo_sano_propio")).toBe(false);
      expect(isProducerOrigin(null)).toBe(false);
    });

    it("detects a resale the seller says they got nearby", () => {
      expect(isNearbyResaleOrigin("reventa_cercana")).toBe(true);
      expect(isNearbyResaleOrigin("reventa_lejana")).toBe(false);
      expect(isNearbyResaleOrigin("productor")).toBe(false);
      expect(isNearbyResaleOrigin(null)).toBe(false);
    });

    it("treats Hazlo Sano origins as admin-only", () => {
      expect(isAdminOnlyOrigin("hazlo_sano_propio")).toBe(true);
      expect(isAdminOnlyOrigin("productor")).toBe(false);
    });
  });

  describe("originsForUser", () => {
    it("offers a seller only what a seller can claim about their own goods", () => {
      expect(originsForUser(false)).toEqual([
        "productor",
        "reventa_cercana",
        "reventa_lejana",
      ]);
    });

    it("keeps the whole allowlist for an admin", () => {
      expect(originsForUser(true)).toHaveLength(5);
      expect(originsForUser(true)).toContain("hazlo_sano_propio");
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
      expect(resolveOriginForUser("productor", false)).toBe("productor");
      expect(resolveOriginForUser("reventa_lejana", false)).toBe(
        "reventa_lejana",
      );
    });
  });
});
