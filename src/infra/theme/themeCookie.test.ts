import { describe, expect, it } from "vitest";
import { parseThemePreference } from "./themeCookie";

describe("parseThemePreference", () => {
  it.each<["light" | "dark"]>([["light"], ["dark"]])("acepta %s", (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it.each<[string, string | null | undefined]>([
    ["ausente", undefined],
    ["nula", null],
    ["vacía", ""],
    ["system, que no se guarda como valor", "system"],
    ["cualquier otra cosa", "oscurísimo"],
  ])("trata %s como seguir al sistema", (_caso, raw) => {
    expect(parseThemePreference(raw)).toBeNull();
  });
});
