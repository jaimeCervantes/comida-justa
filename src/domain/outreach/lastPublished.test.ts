import { describe, expect, it } from "vitest";
import { daysSincePublished, PublicationHistory } from "./lastPublished";

const MEXICO = "America/Mexico_City";

/** Una hora de México (UTC−6 todo el año desde 2022) como instante. */
function mexico(localDateTime: string): Date {
  return new Date(`${localDateTime}:00-06:00`);
}

/** La corrida de escritorio del slice 3 de `difusionEnGrupos.feature`. */
describe("la última vez se dice en días de calendario", () => {
  it.each([
    {
      cuando: "2026-10-13T09:00",
      ahora: "2026-10-13T18:00",
      dias: 0,
      seLee: "hoy",
    },
    {
      cuando: "2026-10-12T23:50",
      ahora: "2026-10-13T00:10",
      dias: 1,
      seLee: "ayer",
    },
    {
      cuando: "2026-10-06T12:00",
      ahora: "2026-10-13T12:00",
      dias: 7,
      seLee: "hace 7 días",
    },
  ])("$cuando visto el $ahora se lee «$seLee»", ({ cuando, ahora, dias }) => {
    expect(daysSincePublished(mexico(cuando), mexico(ahora), MEXICO)).toBe(
      dias,
    );
  });

  it("lo que nunca se publicó no tiene días", () => {
    expect(
      daysSincePublished(null, mexico("2026-10-13T12:00"), MEXICO),
    ).toBeNull();
  });

  // 20 minutos, pero de un día al otro en México; en UTC los dos caen el mismo día.
  it("cuenta el día de México y no el de UTC", () => {
    expect(
      daysSincePublished(
        new Date("2026-10-13T05:50:00Z"),
        new Date("2026-10-13T06:10:00Z"),
        MEXICO,
      ),
    ).toBe(1);
  });

  // Un reloj de servidor un poco adelantado no debe convertir «hoy» en «hace −1 días».
  it("nunca da días negativos", () => {
    expect(
      daysSincePublished(
        mexico("2026-10-14T00:05"),
        mexico("2026-10-13T23:59"),
        MEXICO,
      ),
    ).toBe(0);
  });
});

describe("PublicationHistory", () => {
  const history = new PublicationHistory([
    {
      channelId: "mamas",
      postId: null,
      lastPublishedAt: mexico("2026-10-10T10:00"),
    },
    {
      channelId: "mamas",
      postId: null,
      lastPublishedAt: mexico("2026-10-12T10:00"),
    },
    {
      channelId: "compraventa",
      postId: "pan-chocolate",
      lastPublishedAt: mexico("2026-10-11T10:00"),
    },
  ]);

  it("se queda con la más reciente de cada grupo", () => {
    expect(history.lastPublishedAt("mamas", null)).toEqual(
      mexico("2026-10-12T10:00"),
    );
  });

  it("separa la línea entera de cada pan suelto", () => {
    expect(history.lastPublishedAt("compraventa", "pan-chocolate")).toEqual(
      mexico("2026-10-11T10:00"),
    );
    expect(history.lastPublishedAt("compraventa", null)).toBeNull();
    expect(history.lastPublishedAt("compraventa", "pan-natural")).toBeNull();
  });
});
