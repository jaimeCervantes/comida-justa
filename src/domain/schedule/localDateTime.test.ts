import { describe, expect, it } from "vitest";
import {
  formatCommunityDateTimeLocal,
  formatDateTimeLocalInTimeZone,
  parseCommunityDateTimeLocal,
  parseDateTimeLocalInTimeZone,
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

describe("parseDateTimeLocalInTimeZone", () => {
  it("guarda un horario de Mexico como el instante UTC equivalente", () => {
    expect(
      parseDateTimeLocalInTimeZone(
        "2026-05-22T05:59",
        "America/Mexico_City",
      )?.toISOString(),
    ).toBe("2026-05-22T11:59:00.000Z");
  });

  it("respeta UTC cuando esa es la zona del navegador", () => {
    expect(
      parseDateTimeLocalInTimeZone("2027-08-23T07:30", "UTC")?.toISOString(),
    ).toBe("2027-08-23T07:30:00.000Z");
  });

  it("usa la regla DST de una zona IANA real", () => {
    expect(
      parseDateTimeLocalInTimeZone(
        "2027-08-23T07:30",
        "America/New_York",
      )?.toISOString(),
    ).toBe("2027-08-23T11:30:00.000Z");
  });

  it("cae a la zona comunitaria si el navegador manda una zona inválida", () => {
    expect(
      parseDateTimeLocalInTimeZone(
        "2027-08-23T07:30",
        "Zona/SinNombre",
      )?.toISOString(),
    ).toBe("2027-08-23T13:30:00.000Z");
  });

  it("rechaza una hora local inexistente por cambio de horario", () => {
    expect(
      parseDateTimeLocalInTimeZone("2027-03-14T02:30", "America/New_York"),
    ).toBeNull();
  });
});

describe("formatDateTimeLocalInTimeZone", () => {
  it("muestra el mismo instante en la zona pedida", () => {
    expect(
      formatDateTimeLocalInTimeZone(
        "2027-08-23T11:30:00.000Z",
        "America/New_York",
      ),
    ).toBe("2027-08-23T07:30");
    expect(
      formatDateTimeLocalInTimeZone("2027-08-23T11:30:00.000Z", "UTC"),
    ).toBe("2027-08-23T11:30");
  });
});
