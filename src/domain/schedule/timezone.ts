/**
 * La zona horaria en la que se leen los horarios de los proveedores.
 *
 * El horario se guarda como hora local sin fecha ("los martes de 9 a 14"), así que para convertirlo
 * en instantes hace falta saber de qué zona se habla.
 *
 * **Una constante del sitio y no una columna de `sellers`**, por ahora, y con una razón que va más
 * allá de "es más fácil": la comunidad es de Córdoba y Orizaba —el mismo radio de 50 km que ya usa
 * `SUSTAINABLE_RADIUS_KM`—, así que hoy todos los proveedores están en la misma zona. Una columna
 * pediría un dato que nadie sabría contestar mejor que este valor.
 *
 * **Y es un desplazamiento fijo, no un identificador IANA, porque en México se puede.** El horario
 * de verano se abolió en 2022 (salvo la franja fronteriza del norte, que no es esta), así que
 * Veracruz está en UTC−6 **todo el año**. Sin esa ley, un número fijo sería un error esperando a
 * abril: dos veces al año las citas se correrían una hora.
 *
 * El día que haya un proveedor en otra zona, esto pasa a ser una columna de `sellers` y
 * `expandWeeklyHours` la recibe igual — por eso la función ya toma el desplazamiento como
 * parámetro en vez de leer esta constante por su cuenta.
 */
export const COMMUNITY_UTC_OFFSET_MINUTES = -360;
