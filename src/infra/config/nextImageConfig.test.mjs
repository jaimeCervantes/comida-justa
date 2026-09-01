import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config.mjs";

describe("Next image configuration", () => {
  it("serves remote images directly instead of sending them through Vercel Image Optimization", () => {
    expect(nextConfig.images.unoptimized).toBe(true);
  });

  it("keeps the known remote image hosts documented in the allowlist", () => {
    const hostnames = nextConfig.images.remotePatterns.map(
      (pattern) => pattern.hostname,
    );

    expect(hostnames).toEqual(
      expect.arrayContaining([
        "firebasestorage.googleapis.com",
        "storage.googleapis.com",
        "lh3.googleusercontent.com",
      ]),
    );
  });
});
