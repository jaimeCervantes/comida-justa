/**
 * Qué versión del texto le toca a un grupo, contando desde 0.
 *
 * El turno se reparte por día y por grupo: el grupo `i` recibe la versión `(día + i) mod n`. Así,
 * el mismo día, grupos vecinos reciben versiones distintas —y todas distintas si hay tantas
 * versiones como grupos—, y al día siguiente cada grupo recibe la versión que no tuvo. No hace falta
 * guardar ningún turno: sale de la fecha y del orden de los grupos.
 */
export function versionForGroup(
  dayNumber: number,
  groupIndex: number,
  versionCount: number,
): number {
  if (versionCount <= 1) return 0;

  return (
    (((dayNumber + groupIndex) % versionCount) + versionCount) % versionCount
  );
}

/**
 * La versión del día, para lo que no va a un grupo concreto: la descripción de los artículos de
 * compraventa, que es una sola para todos.
 */
export function versionOfTheDay(
  dayNumber: number,
  versionCount: number,
): number {
  return versionForGroup(dayNumber, 0, versionCount);
}
