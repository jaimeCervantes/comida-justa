import { describe, expect, it } from "vitest";
import { activeKeys, isActive, type PracticeAdoption } from "./adoption";

function adoption(overrides: Partial<PracticeAdoption> = {}): PracticeAdoption {
  return {
    practiceKey: "sleep-mental-unload",
    startedAt: new Date("2026-08-10T06:00:00Z"),
    stoppedAt: null,
    sharingEnabled: false,
    source: "web",
    ...overrides,
  };
}

describe("una adopción", () => {
  it("está activa mientras no se haya dejado", () => {
    expect(isActive(adoption())).toBe(true);
  });

  it("deja de estarlo al marcarse la fecha de fin", () => {
    expect(
      isActive(adoption({ stoppedAt: new Date("2026-08-20T06:00:00Z") })),
    ).toBe(false);
  });

  it("nace privada: compartir es una decisión aparte", () => {
    expect(adoption().sharingEnabled).toBe(false);
  });
});

describe("las claves activas", () => {
  it("deja fuera las que se dejaron, sin perder que existieron", () => {
    const adoptions = [
      adoption(),
      adoption({
        practiceKey: "sleep-paper-book",
        stoppedAt: new Date("2026-08-20T06:00:00Z"),
      }),
    ];

    expect([...activeKeys(adoptions)]).toEqual(["sleep-mental-unload"]);
    expect(adoptions).toHaveLength(2);
  });

  it("sin adopciones es un conjunto vacío, no un fallo", () => {
    expect(activeKeys([]).size).toBe(0);
  });
});
