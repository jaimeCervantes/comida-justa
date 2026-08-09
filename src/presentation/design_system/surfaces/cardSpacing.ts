/**
 * El espaciado de una tarjeta del sitio.
 *
 * Antes cada tarjeta lo decidía por su cuenta y cada elemento traía su propio margen: la tarjeta de
 * una publicación con `p-5`, la de «Mi cuenta» con `p-6`, el título con `mb-3`, la línea de datos
 * con `mt-1`, el precio con `mt-1` **además** de un `block`. Cinco decisiones para una separación
 * que debería ser una.
 *
 * La regla es: **la tarjeta reparte, los elementos no se separan solos.** Un elemento con margen
 * propio dentro de un contenedor con `gap` suma las dos cosas, y la suma no la ve nadie hasta que
 * dos tarjetas distintas quedan lado a lado.
 */

/** El relleno de una tarjeta. */
export const CARD_PADDING = "p-5";

/**
 * La pila vertical de sus bloques, con una sola separación.
 *
 * `gap` y no márgenes porque un `gap` no se transmite a los hijos que no se pintan: un bloque que
 * decide no renderizarse deja de contar, mientras que un `mb-3` sobre el hermano de arriba se
 * queda igual.
 */
export const CARD_STACK = "flex flex-col gap-3";

/**
 * Una fila de datos: se lee de corrido y se parte en varias cuando no cabe.
 *
 * **`empty:hidden` no es un detalle cosmético.** De las 23 publicaciones de la base, los 10
 * anuncios no tienen precio, ni categoría, ni origen, y 5 tampoco tienen tienda: en esos, todos los
 * hijos de esta fila deciden no pintarse y queda un elemento sin nada dentro que aun así ocupa su
 * separación. Es el hueco que aparecía bajo el título de un anuncio. Con `:empty`, una fila sin
 * hijos desaparece y el `gap` de la pila deja de contarla.
 *
 * Se resuelve en CSS y no con una condición en cada sitio a propósito: la condición tendría que
 * repetir la regla interna de cada insignia —cuándo se calla la procedencia, cuándo hay distancia,
 * cuándo hay precio— y quedaría desfasada en cuanto una de ellas cambie.
 */
export const CARD_ROW =
  "flex flex-wrap items-center gap-x-3 gap-y-2 empty:hidden";
