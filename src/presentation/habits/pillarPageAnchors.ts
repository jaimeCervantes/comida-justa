/**
 * Las anclas de una página de pilar, en un módulo **sin una sola importación**.
 *
 * Vivían dentro de los componentes que las llevan, y en cuanto el héroe quiso enlazar a ellas eso
 * dejó de servir: importar `PillarLocalSection` para leer una cadena arrastraba su árbol entero
 * —tarjetas, directorio, navegación y con ellos `next-auth`— hasta el entorno de pruebas, y las seis
 * suites de las páginas de pilar dejaron de cargar con un `ERR_MODULE_NOT_FOUND` que no mencionaba
 * ni el pilar ni el héroe.
 *
 * Una constante no tiene capa. Aquí las dos pueden importarse desde `app/` y desde `presentation/`
 * sin que ninguna arrastre a la otra, y escritas una sola vez no se despegan el día que alguien
 * renombre un `id`: un ancla rota no se queja, simplemente no lleva a ninguna parte.
 */

/** La sección de seguimiento: «Ponlo en práctica». */
export const PILLAR_PRACTICE_ANCHOR = "practica";

/** Lo que hay cerca de este pilar: tiendas y publicaciones de su categoría. */
export const PILLAR_LOCAL_ANCHOR = "cerca";
