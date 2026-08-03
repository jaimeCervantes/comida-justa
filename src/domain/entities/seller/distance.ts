/** Debajo de un kilómetro la cifra que se entiende son metros; encima, kilómetros. */
const METERS_IN_A_KILOMETER = 1000;

export type DistanceUnit = "meters" | "kilometers";

export interface DescribedDistance {
  value: number;
  unit: DistanceUnit;
}

/**
 * La distancia, en la unidad y con la precisión que alguien usa al hablar.
 *
 * Devuelve un número y una unidad, no un texto: el texto es traducción y vive en el catálogo. Y
 * redondea a propósito —metros enteros, kilómetros con un decimal— porque "1.4832 km" no ayuda a
 * decidir a nadie, y fingir precisión sobre una coordenada de navegador es fingir dos veces.
 */
export function describeDistance(meters: number): DescribedDistance | null {
  if (!Number.isFinite(meters) || meters < 0) return null;

  if (meters < METERS_IN_A_KILOMETER) {
    return { value: Math.round(meters), unit: "meters" };
  }

  return {
    value: Math.round(meters / 100) / 10,
    unit: "kilometers",
  };
}
