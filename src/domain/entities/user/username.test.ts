import { describe, expect, it } from "vitest";
import { UsernameUnusableError } from "./errors";
import {
  generateUsername,
  isValidUsername,
  RESERVED_USERNAMES,
  resolveUsername,
  USERNAME_MAX_LENGTH,
} from "./username";

describe("generateUsername", () => {
  // Nombres reales de las cuentas que publican hoy.
  it.each([
    ["Jaime Cervantes", "jaime-cervantes"],
    ["Daniels Rodroguez", "daniels-rodroguez"],
    ["DANIEL MATAMOROS ECHEVARRIA", "daniel-matamoros-echevarria"],
    ["Healthy Food", "healthy-food"],
    ["  Panadería  ", "panaderia"],
  ])("%j se convierte en %j", (name, expected) => {
    expect(generateUsername(name)).toBe(expected);
  });

  it("recorta sin dejar un guion colgando", () => {
    const username = generateUsername(
      `${"a".repeat(USERNAME_MAX_LENGTH)} Ruiz`,
    );

    expect(username).toHaveLength(USERNAME_MAX_LENGTH);
    expect(username.endsWith("-")).toBe(false);
  });
});

describe("isValidUsername", () => {
  it.each([
    ["jaime", true],
    ["abc", true],
    ["ab", false],
    ["", false],
  ])("%j → %s", (username, expected) => {
    expect(isValidUsername(username)).toBe(expected);
  });

  it.each(RESERVED_USERNAMES)("%j está reservado para la ruta /u", (name) => {
    expect(isValidUsername(name)).toBe(false);
  });
});

describe("resolveUsername", () => {
  it("devuelve la dirección cuando el nombre sirve", () => {
    expect(resolveUsername("Jaime Cervantes")).toBe("jaime-cervantes");
  });

  // La cuenta que hoy encabeza la tabla se llama ".." — un nombre así no da dirección.
  it.each(["..", "###", "ab", ""])("%j se rechaza explicándolo", (source) => {
    expect(() => resolveUsername(source)).toThrow(UsernameUnusableError);
  });
});
