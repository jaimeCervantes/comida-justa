import { describe, expect, it } from "vitest";
import RouteFileError from "~/domain/errors/RouteFileError";
import {
  MAX_ROUTE_POINTS,
  metersBetween,
  parseGpx,
  reducePoints,
  routeLengthInMeters,
} from "./gpx";

/** Un GPX mínimo, con la forma que exporta cualquier reloj. */
function gpx(points: string): string {
  return `<?xml version="1.0"?>
<gpx version="1.1" creator="Garmin">
  <trk><name>Rodada del sábado</name><trkseg>
${points}
  </trkseg></trk>
</gpx>`;
}

/** El kiosco de Córdoba, que es de donde sale la rodada. */
const KIOSCO = { latitude: 18.8853, longitude: -96.9337 };

describe("metersBetween", () => {
  /* Un grado de latitud son ~111,2 km en cualquier punto del planeta: es la comprobación que no
     depende de ninguna librería ni de ninguna tabla. */
  it("un grado de latitud son unos 111 km", () => {
    const metros = metersBetween(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );

    expect(metros).toBeGreaterThan(111_000);
    expect(metros).toBeLessThan(111_400);
  });

  it("dos puntos iguales distan cero", () => {
    expect(metersBetween(KIOSCO, KIOSCO)).toBe(0);
  });

  /* Un grado de longitud encoge con el coseno de la latitud: a 60° mide la mitad que en el ecuador.
     Sin esto, una fórmula plana pasaría el caso anterior y fallaría en el mundo real. */
  it("un grado de longitud encoge al alejarse del ecuador", () => {
    const enElEcuador = metersBetween(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    );
    const a60Grados = metersBetween(
      { latitude: 60, longitude: 0 },
      { latitude: 60, longitude: 1 },
    );

    expect(a60Grados / enElEcuador).toBeCloseTo(0.5, 2);
  });
});

describe("routeLengthInMeters", () => {
  it("suma los tramos", () => {
    const puntos = [
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
      { latitude: 2, longitude: 0 },
    ];

    expect(routeLengthInMeters(puntos)).toBeCloseTo(
      metersBetween(puntos[0], puntos[1]) * 2,
      0,
    );
  });

  it("un solo punto no tiene largo", () => {
    expect(routeLengthInMeters([KIOSCO])).toBe(0);
  });
});

describe("reducePoints", () => {
  const muchos = Array.from({ length: 5_000 }, (_, i) => ({
    latitude: 18.88 + i * 0.0001,
    longitude: -96.93,
  }));

  it("no toca lo que ya cabe", () => {
    const pocos = [KIOSCO, { latitude: 18.9, longitude: -96.9 }];

    expect(reducePoints(pocos)).toEqual(pocos);
  });

  it("recorta lo que se pasa del tope", () => {
    expect(reducePoints(muchos).length).toBeLessThanOrEqual(
      MAX_ROUTE_POINTS + 1,
    );
  });

  /* Perder el último punto movería el final de la ruta, que es justo donde la gente mira para saber
     dónde termina. */
  it("conserva siempre el primero y el último", () => {
    const reducidos = reducePoints(muchos);

    expect(reducidos[0]).toEqual(muchos[0]);
    expect(reducidos[reducidos.length - 1]).toEqual(muchos[muchos.length - 1]);
  });
});

describe("parseGpx", () => {
  it("lee los puntos de un track, en orden", () => {
    const ruta = parseGpx(
      gpx(`    <trkpt lat="18.8853" lon="-96.9337"><ele>800</ele></trkpt>
    <trkpt lat="18.8860" lon="-96.9340"></trkpt>`),
    );

    expect(ruta.points).toEqual([
      { latitude: 18.8853, longitude: -96.9337 },
      { latitude: 18.886, longitude: -96.934 },
    ]);
    expect(ruta.meters).toBeGreaterThan(0);
    expect(ruta.originalPoints).toBe(2);
  });

  /* Los atributos de XML no tienen orden garantizado, y hay exportadores que ponen `lon` primero.
     Un parser que asumiera el orden fallaría solo con algunos relojes, que es el peor fallo. */
  it("no le importa el orden de los atributos", () => {
    const ruta = parseGpx(
      gpx(`    <trkpt lon="-96.9337" lat="18.8853"/>
    <trkpt lat='18.8860' lon='-96.9340'/>`),
    );

    expect(ruta.points).toHaveLength(2);
    expect(ruta.points[0]).toEqual({ latitude: 18.8853, longitude: -96.9337 });
  });

  it("acepta también una ruta declarada con rtept", () => {
    const ruta = parseGpx(`<gpx><rte>
      <rtept lat="18.8853" lon="-96.9337"/>
      <rtept lat="18.8860" lon="-96.9340"/>
    </rte></gpx>`);

    expect(ruta.points).toHaveLength(2);
  });

  /* Un GPX de 7.000 puntos con uno corrupto sigue siendo una ruta utilizable: se salta el punto,
     no el archivo. */
  it("se salta un punto ilegible en vez de tumbar el archivo", () => {
    const ruta = parseGpx(
      gpx(`    <trkpt lat="18.8853" lon="-96.9337"/>
    <trkpt lat="no-es-un-numero" lon="-96.9340"/>
    <trkpt lat="999" lon="-96.9340"/>
    <trkpt lat="18.8860" lon="-96.9340"/>`),
    );

    expect(ruta.points).toHaveLength(2);
  });

  /* La distancia se mide sobre TODOS los puntos y el dibujo se reduce después: el número tiene que
     ser fiel —quien corre sabe si su ruta son 8 km— y el dibujo solo tiene que parecerse. */
  it("mide sobre todos los puntos aunque guarde menos", () => {
    const muchos = Array.from(
      { length: 5_000 },
      (_, i) =>
        `<trkpt lat="${(18.88 + i * 0.00001).toFixed(6)}" lon="-96.93"/>`,
    ).join("\n");

    const ruta = parseGpx(gpx(muchos));

    expect(ruta.originalPoints).toBe(5_000);
    expect(ruta.points.length).toBeLessThanOrEqual(MAX_ROUTE_POINTS + 1);
    // ~0,05 grados de latitud ≈ 5,5 km, medidos sobre los 5.000.
    expect(ruta.meters).toBeGreaterThan(5_000);
  });

  describe("cuando el archivo no sirve", () => {
    it.each([
      ["", "empty"],
      ["   ", "empty"],
      ["<html><body>hola</body></html>", "not-gpx"],
      ['{"type":"FeatureCollection"}', "not-gpx"],
    ])("%s → %s", (contenido, problema) => {
      expect(() => parseGpx(contenido)).toThrowError(
        expect.objectContaining({ problem: problema }),
      );
    });

    it("un GPX sin puntos suficientes lo dice", () => {
      expect(() =>
        parseGpx(gpx('<trkpt lat="18.8853" lon="-96.9337"/>')),
      ).toThrow(RouteFileError);
      expect(() =>
        parseGpx(gpx('<trkpt lat="18.8853" lon="-96.9337"/>')),
      ).toThrowError(expect.objectContaining({ problem: "too-few-points" }));
    });
  });
});
