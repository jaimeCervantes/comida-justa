import { describe, expect, it } from "vitest";
import {
  fresherOf,
  isStale,
  metersBetween,
  needsRefresh,
  SIGNIFICANT_MOVE_METERS,
  STALE_AFTER_MS,
  type VisitorFix,
} from "./locationFreshness";
import { COMMUNITY_ANCHOR } from "./proximity";

const NOW = new Date("2026-08-05T12:00:00.000Z");

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

/*
 * Un grado de latitud sobre la esfera que usa `metersBetween` (R = 6 371 008.8 m). Se usa **esa**
 * y no los 111.32 km del elipsoide para que el helper sea el inverso exacto de la función que se
 * prueba: si no, la fila del umbral cae a 499.4 m y falla por un artefacto del andamio, no por la
 * regla. Mover solo la latitud evita además el coseno de la longitud.
 */
const METERS_PER_LATITUDE_DEGREE = (2 * Math.PI * 6_371_008.8) / 360;

function metersNorthOfAnchor(meters: number) {
  return {
    latitude: COMMUNITY_ANCHOR.latitude + meters / METERS_PER_LATITUDE_DEGREE,
    longitude: COMMUNITY_ANCHOR.longitude,
  };
}

describe("metersBetween", () => {
  it("mide cero entre un punto y sí mismo", () => {
    expect(metersBetween(COMMUNITY_ANCHOR, COMMUNITY_ANCHOR)).toBe(0);
  });

  /*
   * No se le pide precisión de topógrafo: su único trabajo es contestar "¿me moví lo bastante como
   * para molestar al servidor?". La verdad de las distancias que se enseñan sigue siendo PostGIS.
   */
  it.each<[string, number]>([
    ["120 m", 120],
    ["500 m", 500],
    ["2 km", 2_000],
    ["40 km", 40_000],
  ])("recupera %s desplazando la latitud", (_caso, metros) => {
    const medido = metersBetween(COMMUNITY_ANCHOR, metersNorthOfAnchor(metros));

    expect(medido).toBeGreaterThan(metros * 0.99);
    expect(medido).toBeLessThan(metros * 1.01);
  });

  it("cuenta la longitud, no solo la latitud", () => {
    const alEste = {
      latitude: COMMUNITY_ANCHOR.latitude,
      longitude: COMMUNITY_ANCHOR.longitude + 0.01,
    };

    expect(metersBetween(COMMUNITY_ANCHOR, alEste)).toBeGreaterThan(900);
  });
});

describe("isStale", () => {
  /*
   * Corrida de escritorio con las antigüedades que hay HOY en `users.location_updated_at`
   * (consultado el 2026-08-05): 2.2, 2.5, 10.2, 10.6 y 137 días. Las cinco caducan; ese es el
   * problema que esta feature resuelve.
   */
  it.each<[string, Date | null, boolean]>([
    ["recién compartida", NOW, false],
    ["a 5.9 h, dentro del margen", hoursAgo(5.9), false],
    ["a 6 h justas, el límite es inclusivo", hoursAgo(6), true],
    ["de ayer", hoursAgo(24), true],
    ["la de hace 2.2 días que hay en la base", hoursAgo(2.2 * 24), true],
    ["la de hace 137 días que hay en la base", hoursAgo(137 * 24), true],
    ["sin fecha: una cookie del formato anterior", null, true],
  ])("%s → caduca: %s", (_caso, fixedAt, esperado) => {
    expect(isStale(fixedAt, NOW)).toBe(esperado);
  });

  it("una fecha del futuro no se toma por caducada", () => {
    expect(isStale(new Date(NOW.getTime() + STALE_AFTER_MS), NOW)).toBe(false);
  });
});

describe("needsRefresh", () => {
  const recien: VisitorFix = { coordinates: COMMUNITY_ANCHOR, fixedAt: NOW };

  /*
   * El filtro que evita el desastre de rendimiento: sin él, cada carga de página escribiría la
   * cookie y llamaría a `revalidatePath("/", "layout")`, que invalida el árbol entero.
   */
  it.each<[string, number, boolean]>([
    ["no se movió", 0, false],
    ["ruido de GPS: el texto de la tarjeta ni cambia", 120, false],
    ["justo en el umbral, que es inclusivo", SIGNIFICANT_MOVE_METERS, true],
    ["dos kilómetros ya cambian a quién tienes cerca", 2_000, true],
  ])("recién guardada y %s → guarda: %s", (_caso, metros, esperado) => {
    expect(needsRefresh(recien, metersNorthOfAnchor(metros), NOW)).toBe(
      esperado,
    );
  });

  it("guarda aunque no te muevas si el dato ya caducó", () => {
    const vieja: VisitorFix = {
      coordinates: COMMUNITY_ANCHOR,
      fixedAt: hoursAgo(7),
    };

    expect(needsRefresh(vieja, COMMUNITY_ANCHOR, NOW)).toBe(true);
  });

  it("sin nada guardado, cualquier lectura vale la pena", () => {
    expect(needsRefresh(null, COMMUNITY_ANCHOR, NOW)).toBe(true);
  });

  it("no guarda una lectura que no es una coordenada", () => {
    expect(
      needsRefresh(null, { latitude: Number.NaN, longitude: 0 }, NOW),
    ).toBe(false);
    // 0,0 es el Golfo de Guinea: en la práctica, "no se pudo leer nada".
    expect(needsRefresh(null, { latitude: 0, longitude: 0 }, NOW)).toBe(false);
  });
});

describe("fresherOf", () => {
  const cookie = (fixedAt: Date | null): VisitorFix => ({
    coordinates: COMMUNITY_ANCHOR,
    fixedAt,
  });
  const columna = (fixedAt: Date | null): VisitorFix => ({
    coordinates: { latitude: 25.6866, longitude: -100.3161 },
    fixedAt,
  });

  /*
   * La cookie ya no gana por ser cookie, gana por ser más nueva. Es lo que arregla el caso real:
   * alguien comparte su ubicación por WhatsApp desde otra ciudad y la web sigue midiendo desde su
   * casa porque tiene una cookie de hace meses.
   */
  it.each<[string, Date | null, Date | null, "cookie" | "columna"]>([
    ["la del navegador es más nueva", hoursAgo(0.16), hoursAgo(48), "cookie"],
    [
      "compartió su ubicación de viaje por WhatsApp",
      hoursAgo(137 * 24),
      hoursAgo(1),
      "columna",
    ],
    ["cookie del formato anterior, sin fecha", null, hoursAgo(48), "cookie"],
    ["el bot nunca supo de esta persona", hoursAgo(1), null, "cookie"],
    ["empate: manda la explícita", hoursAgo(1), hoursAgo(1), "cookie"],
  ])("%s → gana la %s", (_caso, fechaCookie, fechaColumna, ganadora) => {
    const elegida = fresherOf(cookie(fechaCookie), columna(fechaColumna));

    expect(elegida?.coordinates).toEqual(
      ganadora === "cookie" ? COMMUNITY_ANCHOR : columna(null).coordinates,
    );
  });

  it("devuelve la que haya cuando solo hay una", () => {
    expect(fresherOf(cookie(NOW), null)?.coordinates).toEqual(COMMUNITY_ANCHOR);
    expect(fresherOf(null, columna(NOW))?.coordinates).toEqual(
      columna(null).coordinates,
    );
  });

  it("null cuando no hay ninguna", () => {
    expect(fresherOf(null, null)).toBeNull();
  });
});
