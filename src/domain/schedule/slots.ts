/**
 * Los huecos libres de un proveedor.
 *
 * **No se guardan, se derivan**: materializar cada hueco sería escribir un calendario infinito y
 * mantenerlo sincronizado con cada cita, cada cambio de horario y cada día que el proveedor cierre.
 *
 *     huecos = horario semanal − excepciones − citas ya tomadas
 *
 * Todo esto es aritmética sobre instantes, sin base de datos ni red, que es exactamente donde se
 * quiere tener la lógica de un calendario: es la parte que más se puede equivocar y la única que se
 * puede probar entera.
 *
 * Ver `docs/features/cuatro-pilares-vivos.md`.
 */

/** Un tramo de tiempo, medio abierto: `[startsAt, endsAt)`. El final no pertenece al tramo. */
export type Interval = {
  startsAt: Date;
  endsAt: Date;
};

/** Una franja de la semana tipo: "los martes de 9:00 a 14:00". */
export type WeeklyHours = {
  /** 0 = domingo … 6 = sábado, igual que `Date.getDay()` y que `EXTRACT(DOW)`. */
  weekday: number;
  /** Minutos desde la medianoche, hora local del proveedor. 9:00 son 540. */
  startsMinutes: number;
  endsMinutes: number;
};

const MINUTES = 60_000;
const DAY = 24 * 60 * MINUTES;

/** ¿Se pisan? Con tramos medio abiertos, tocarse por el extremo **no** es pisarse. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

/**
 * Le quita a un tramo lo que ocupa otro. Devuelve 0, 1 o **2** trozos.
 *
 * Los dos trozos son el caso que se olvida: una cita de 11:00 a 12:00 en mitad de una jornada de
 * 9:00 a 14:00 no la acorta, **la parte en dos** —de 9 a 11 y de 12 a 14—. Una resta que devolviera
 * un solo tramo perdería la tarde entera.
 */
export function subtract(from: Interval, busy: Interval): Interval[] {
  if (!overlaps(from, busy)) return [from];

  const pieces: Interval[] = [];

  if (busy.startsAt > from.startsAt) {
    pieces.push({ startsAt: from.startsAt, endsAt: busy.startsAt });
  }

  if (busy.endsAt < from.endsAt) {
    pieces.push({ startsAt: busy.endsAt, endsAt: from.endsAt });
  }

  return pieces;
}

/** Le quita a un tramo todo lo ocupado, uno detrás de otro. */
function subtractAll(from: Interval, busy: readonly Interval[]): Interval[] {
  return busy.reduce<Interval[]>(
    (free, taken) => free.flatMap((piece) => subtract(piece, taken)),
    [from],
  );
}

/**
 * Parte un tramo libre en huecos consecutivos de la duración pedida.
 *
 * Lo que sobra al final **se tira**: media hora libre no es un hueco para una consulta de 45
 * minutos, y ofrecerla sería citar a alguien para echarlo a medias.
 */
export function chop(free: Interval, durationMinutes: number): Interval[] {
  if (durationMinutes <= 0) return [];

  const length = durationMinutes * MINUTES;
  const slots: Interval[] = [];

  for (
    let start = free.startsAt.getTime();
    start + length <= free.endsAt.getTime();
    start += length
  ) {
    slots.push({
      startsAt: new Date(start),
      endsAt: new Date(start + length),
    });
  }

  return slots;
}

export type FreeSlotsInput = {
  /** Los tramos en que el proveedor atiende, ya como instantes concretos. */
  working: readonly Interval[];
  /** Lo que ya no está libre: vacaciones, cierres y citas tomadas, todo junto. */
  busy: readonly Interval[];
  /** Cuánto ocupa el servicio que se quiere pedir. */
  durationMinutes: number;
  /** Ahora. Un hueco que ya empezó no se ofrece. */
  now?: Date;
};

/**
 * Los huecos que se le pueden ofrecer a alguien.
 *
 * El orden importa: primero se le resta lo ocupado a la jornada y **después** se parte lo que queda.
 * Al revés —partir la jornada entera y luego descartar los huecos que chocan— se perderían los que
 * caben en los bordes: una cita de 9:15 a 9:45 dejaría inservibles el hueco de 9:00 y el de 9:30,
 * cuando en realidad de 9:45 a 10:30 cabe uno perfectamente.
 */
export function freeSlots({
  working,
  busy,
  durationMinutes,
  now = new Date(),
}: FreeSlotsInput): Interval[] {
  return working
    .flatMap((shift) => subtractAll(shift, busy))
    .flatMap((piece) => chop(piece, durationMinutes))
    .filter((slot) => slot.startsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Convierte la semana tipo en tramos concretos dentro de una ventana.
 *
 * La hora del horario es **local del proveedor** y sin fecha ("los martes de 9 a 14" es una regla,
 * no un instante), así que hace falta la zona para saber a qué momento del universo corresponde.
 *
 * `offsetMinutes` es esa zona, como desplazamiento respecto a UTC. Se recibe en vez de leerse aquí
 * para que la función siga siendo pura y probable: quien la llama sabe de qué proveedor habla.
 */
export function expandWeeklyHours(
  hours: readonly WeeklyHours[],
  window: Interval,
  offsetMinutes: number,
): Interval[] {
  const expanded: Interval[] = [];

  /* Se empieza un día antes del inicio de la ventana: una jornada que arranca a las 23:00 hora
     local puede caer, en UTC, ya dentro de la ventana aunque su día no lo esté. */
  const first = startOfUtcDay(new Date(window.startsAt.getTime() - DAY));

  for (let day = first.getTime(); day <= window.endsAt.getTime(); day += DAY) {
    /* El día de la semana es el de la FECHA local, y `day` ya la representa: el desplazamiento de
       zona se aplica abajo, al convertir la hora en instante. Aplicarlo también aquí lo corría un
       día entero —un miércoles se leía como martes— y el horario salía en el día equivocado. */
    const weekday = new Date(day).getUTCDay();

    for (const shift of hours) {
      if (shift.weekday !== weekday) continue;

      const startsAt = new Date(
        day + (shift.startsMinutes - offsetMinutes) * MINUTES,
      );
      const endsAt = new Date(
        day + (shift.endsMinutes - offsetMinutes) * MINUTES,
      );

      const clipped = {
        startsAt: startsAt < window.startsAt ? window.startsAt : startsAt,
        endsAt: endsAt > window.endsAt ? window.endsAt : endsAt,
      };

      if (clipped.startsAt < clipped.endsAt) expanded.push(clipped);
    }
  }

  return expanded;
}

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}
