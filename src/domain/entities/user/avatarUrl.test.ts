import { describe, expect, it } from "vitest";
import { largeGoogleAvatarUrl } from "./avatarUrl";

describe("largeGoogleAvatarUrl", () => {
  it("pide un recorte mayor a la URL de Google, sin tocar el resto", () => {
    const url =
      "https://lh3.googleusercontent.com/a/ACg8ocJPHMJQfNacV-p6HHDEDgKi-pfQs06MbdKTFgE1QW-4jVHIxwdp=s96-c";

    expect(largeGoogleAvatarUrl(url, 480)).toBe(
      "https://lh3.googleusercontent.com/a/ACg8ocJPHMJQfNacV-p6HHDEDgKi-pfQs06MbdKTFgE1QW-4jVHIxwdp=s480-c",
    );
  });

  it.each([
    [null],
    [undefined],
    ["https://miotroproveedor.com/foto.jpg"],
    ["https://lh3.googleusercontent.com/foto-sin-sufijo"],
  ])("deja igual una URL sin el sufijo de Google (%s)", (url) => {
    expect(largeGoogleAvatarUrl(url, 480)).toBe(url);
  });
});
