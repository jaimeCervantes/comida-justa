import { areValidCoordinates, type Coordinates } from "./coordinates";

/**
 * Una ubicación **con fecha**. La fecha es la mitad que faltaba.
 *
 * Sin ella no se puede contestar la única pregunta que importa cuando alguien se mueve: ¿esto que
 * tengo guardado sigue siendo cierto? `fixedAt` acepta `null` porque las cookies del formato
 * anterior no la traen, y esas cookies duran un año: hay navegadores reales con una puesta hoy.
 */
export interface VisitorFix {
  coordinates: Coordinates;
  fixedAt: Date | null;
}

/**
 * A partir de cuándo una posición deja de merecer confianza.
 *
 * Seis horas es el turno de una jornada: cubre "salí de casa al trabajo" y "llegué a la ciudad a la
 * que viajaba" sin repreguntar durante una sola visita larga al sitio. No pretende ser exacto —lo
 * que hay hoy en `users.location_updated_at` son 2.2, 2.5, 10.2, 10.6 y 137 días, y cualquier
 * umbral razonable los descarta a los cinco.
 */
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

/**
 * Cuánto hay que moverse para que valga la pena escribir.
 *
 * Cada escritura arrastra un `revalidatePath("/", "layout")`, que invalida el árbol entero de rutas
 * y obliga a un segundo render completo. Por debajo de 500 m `describeDistance` casi nunca cambia
 * el texto que alguien lee en la tarjeta, así que pagar ese render sería pagar por nada.
 */
export const SIGNIFICANT_MOVE_METERS = 500;

/** Cada cuánto vale la pena volver a mirar al regresar a la pestaña. */
export const RECHECK_AFTER_MS = 15 * 60 * 1000;

const EARTH_RADIUS_METERS = 6_371_008.8;

/**
 * La distancia en metros entre dos puntos (haversine).
 *
 * Es la **única** aritmética de distancia en JavaScript del proyecto, y existe para una sola
 * pregunta: "¿me moví lo suficiente como para molestar al servidor?". La verdad de las distancias
 * que se le enseñan a alguien la sigue calculando PostGIS con `ST_Distance` sobre `geography`, que
 * usa el elipsoide y no una esfera.
 */
export function metersBetween(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * ¿Este dato ya es viejo?
 *
 * Sin fecha, sí: una cookie del formato anterior puede llevar un año ahí, y tratarla como fresca
 * sería justo el error que esta feature existe para corregir. Una fecha del futuro se deja pasar —
 * un reloj adelantado no es motivo para dar por caducado algo que acaba de llegar.
 */
export function isStale(fixedAt: Date | null, now: Date): boolean {
  if (!fixedAt) return true;

  return now.getTime() - fixedAt.getTime() >= STALE_AFTER_MS;
}

/**
 * ¿Vale la pena guardar esta lectura nueva?
 *
 * Solo si dice algo distinto (te moviste de verdad) o si lo guardado ya caducó. Es el filtro que
 * separa "la app siempre detecta dónde estás" de "la app se re-renderiza entera en cada carga".
 */
export function needsRefresh(
  stored: VisitorFix | null,
  next: Coordinates,
  now: Date,
): boolean {
  if (!areValidCoordinates(next)) return false;
  if (!stored) return true;
  if (isStale(stored.fixedAt, now)) return true;

  return metersBetween(stored.coordinates, next) >= SIGNIFICANT_MOVE_METERS;
}

export type AgeUnit = "minute" | "hour" | "day";

export interface DescribedAge {
  value: number;
  unit: AgeUnit;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Cuánto hace que se supo esto, en la unidad con la que alguien lo diría.
 *
 * Devuelve número y unidad, no un texto: el texto es traducción, y aquí lo formatea
 * `Intl.RelativeTimeFormat` con el idioma activo. Es el mismo trato que `describeDistance`.
 *
 * Redondea hacia abajo a propósito. "Hace 1 hora" cuando han pasado 119 minutos es lo que diría
 * cualquiera; fingir precisión sobre una lectura de GPS es fingir dos veces.
 *
 * `null` sin fecha —las cookies del formato anterior— porque no sabemos cuándo fue, y decir "hace
 * un momento" sería inventarlo.
 */
export function describeAge(
  fixedAt: Date | null,
  now: Date,
): DescribedAge | null {
  if (!fixedAt) return null;

  const elapsed = now.getTime() - fixedAt.getTime();

  if (!Number.isFinite(elapsed) || elapsed < 0) return null;

  if (elapsed < HOUR_MS) {
    return { value: Math.floor(elapsed / MINUTE_MS), unit: "minute" };
  }

  if (elapsed < DAY_MS) {
    return { value: Math.floor(elapsed / HOUR_MS), unit: "hour" };
  }

  return { value: Math.floor(elapsed / DAY_MS), unit: "day" };
}

/**
 * De dos ubicaciones conocidas, la más reciente.
 *
 * Antes la cookie ganaba **por ser cookie**. Ahora gana por ser más nueva, y eso arregla un caso
 * real: quien comparte su ubicación con el bot de WhatsApp desde otra ciudad seguía viendo el sitio
 * medido desde su casa, porque tenía una cookie de hace meses que nadie iba a desbancar.
 *
 * En un empate —o cuando ninguna trae fecha— gana la primera, que es la cookie: es la que alguien
 * puso explícitamente en este navegador.
 */
export function fresherOf(
  preferred: VisitorFix | null,
  other: VisitorFix | null,
): VisitorFix | null {
  if (!preferred) return other;
  if (!other) return preferred;

  /* Sin fecha en alguno de los dos no hay comparación posible, y ante la duda manda la preferida:
     así una cookie del formato anterior sigue comportándose exactamente como se comportaba. */
  if (!preferred.fixedAt || !other.fixedAt) return preferred;

  return other.fixedAt.getTime() > preferred.fixedAt.getTime()
    ? other
    : preferred;
}
