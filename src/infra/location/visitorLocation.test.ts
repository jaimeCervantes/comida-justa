import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";

const { auth, getCookie, selectRows } = vi.hoisted(() => ({
  auth: vi.fn(),
  getCookie: vi.fn(),
  selectRows: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: getCookie }),
}));
vi.mock("~/infra/auth", () => ({ auth }));
/* La cadena de Drizzle se resuelve al final: basta con que `limit` entregue las filas que el
   escenario quiera. Lo que se prueba es la precedencia, no cómo se arma la consulta. */
vi.mock("~/infra/dataAccess/db/connection", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: selectRows }),
      }),
    }),
  },
}));

import { readVisitorFix, readVisitorLocation } from "./visitorLocation";

const MONTERREY = { latitude: 25.6866, longitude: -100.3161 };

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function cookieWith(coordinates: typeof COMMUNITY_ANCHOR, at: Date | null) {
  const stamp = at ? `,${at.getTime()}` : "";
  getCookie.mockReturnValue({
    value: `${coordinates.latitude},${coordinates.longitude}${stamp}`,
  });
}

function accountWith(coordinates: typeof MONTERREY, at: Date | null) {
  auth.mockResolvedValue({ user: { id: "user-1" } });
  selectRows.mockResolvedValue([
    {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      updatedAt: at,
    },
  ]);
}

describe("readVisitorFix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockReturnValue(undefined);
    auth.mockResolvedValue(null);
    selectRows.mockResolvedValue([]);
  });

  it("null cuando no hay cookie ni cuenta", async () => {
    await expect(readVisitorFix()).resolves.toBeNull();
  });

  it("la cookie sola, con su fecha", async () => {
    const at = hoursAgo(1);
    cookieWith(COMMUNITY_ANCHOR, at);

    await expect(readVisitorFix()).resolves.toEqual({
      coordinates: COMMUNITY_ANCHOR,
      fixedAt: at,
    });
  });

  it("una cookie del formato anterior se lee sin fecha", async () => {
    cookieWith(COMMUNITY_ANCHOR, null);

    await expect(readVisitorFix()).resolves.toEqual({
      coordinates: COMMUNITY_ANCHOR,
      fixedAt: null,
    });
  });

  it("sin sesión no se consulta la columna del bot", async () => {
    await readVisitorFix();

    expect(selectRows).not.toHaveBeenCalled();
  });

  it("la columna del bot cuando no hay cookie", async () => {
    const at = hoursAgo(2);
    accountWith(MONTERREY, at);

    await expect(readVisitorFix()).resolves.toEqual({
      coordinates: MONTERREY,
      fixedAt: at,
    });
  });

  /*
   * El caso que esta feature existe para arreglar. Con los datos de hoy: hay una cuenta cuya
   * ubicación tiene 137 días. Si esa persona comparte su ubicación con el bot desde otra ciudad,
   * antes seguía viendo el sitio medido desde su cookie vieja.
   */
  it("gana la del bot cuando la cookie es más vieja", async () => {
    cookieWith(COMMUNITY_ANCHOR, hoursAgo(137 * 24));
    accountWith(MONTERREY, hoursAgo(1));

    await expect(readVisitorFix()).resolves.toMatchObject({
      coordinates: MONTERREY,
    });
  });

  it("gana la cookie cuando es más nueva", async () => {
    cookieWith(COMMUNITY_ANCHOR, hoursAgo(0.1));
    accountWith(MONTERREY, hoursAgo(48));

    await expect(readVisitorFix()).resolves.toMatchObject({
      coordinates: COMMUNITY_ANCHOR,
    });
  });

  it("una cookie sin fecha sigue mandando, como antes de este cambio", async () => {
    cookieWith(COMMUNITY_ANCHOR, null);
    accountWith(MONTERREY, hoursAgo(48));

    await expect(readVisitorFix()).resolves.toMatchObject({
      coordinates: COMMUNITY_ANCHOR,
    });
  });

  it("descarta una columna a medias", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    selectRows.mockResolvedValue([
      { latitude: 25.68, longitude: null, updatedAt: hoursAgo(1) },
    ]);

    await expect(readVisitorFix()).resolves.toBeNull();
  });
});

describe("readVisitorLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockReturnValue(undefined);
    auth.mockResolvedValue(null);
    selectRows.mockResolvedValue([]);
  });

  it("entrega solo las coordenadas, que es lo que piden las páginas", async () => {
    cookieWith(COMMUNITY_ANCHOR, hoursAgo(1));

    await expect(readVisitorLocation()).resolves.toEqual(COMMUNITY_ANCHOR);
  });

  it("null cuando no sabemos nada", async () => {
    await expect(readVisitorLocation()).resolves.toBeNull();
  });
});
