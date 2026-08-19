import { describe, expect, it } from "vitest";
import {
  formatCommunityDateTimeLocal,
  parseCommunityDateTimeLocal,
} from "./localDateTime";

describe("parseCommunityDateTimeLocal", () => {
  it("interpreta el datetime-local como hora local de la comunidad", () => {
    expect(parseCommunityDateTimeLocal("2027-08-23T07:30")?.toISOString()).toBe(
      "2027-08-23T13:30:00.000Z",
    );
  });

  it("acepta segundos cuando el navegador los manda", () => {
    expect(
      parseCommunityDateTimeLocal("2027-08-23T07:30:45")?.toISOString(),
    ).toBe("2027-08-23T13:30:45.000Z");
  });

  it.each(["", "mañana", "2027-02-31T07:30", "2027-08-23T24:00"])(
    "devuelve null para un valor inválido: %s",
    (value) => {
      expect(parseCommunityDateTimeLocal(value)).toBeNull();
    },
  );
});

describe("formatCommunityDateTimeLocal", () => {
  it("muestra el instante guardado como hora local de la comunidad", () => {
    expect(formatCommunityDateTimeLocal("2027-08-23T13:30:00.000Z")).toBe(
      "2027-08-23T07:30",
    );
  });

  it("devuelve vacío para valores ausentes o inválidos", () => {
    expect(formatCommunityDateTimeLocal(null)).toBe("");
    expect(formatCommunityDateTimeLocal("sin fecha")).toBe("");
  });
});
