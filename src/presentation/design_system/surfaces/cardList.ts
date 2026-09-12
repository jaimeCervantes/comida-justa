/**
 * Un listado de tarjetas en mampostería.
 *
 * Antes cada listado escribía su propia rejilla, y ya habían divergido: nueve copias de casi la
 * misma cadena, con `minmax` de 300px, 240px y 320px, con `pt-6`, `pt-2` o nada, y varias
 * repitiendo `max-sm:` y `sm:` con **el mismo** valor, que es una condición que no decide nada.
 *
 * **Por qué columnas y no rejilla.** En una rejilla, todas las tarjetas de una fila se estiran a la
 * más alta; como `Card` empuja la firma al fondo con `mt-auto`, la que tiene poco contenido queda
 * con un vacío en medio. La mampostería nativa de CSS (`grid-template-rows: masonry`) todavía no
 * está en ningún navegador estable, así que se hace con multi-columna, que sí lo está y no cuesta
 * JavaScript ni medición en el cliente.
 *
 * **El coste, que es real:** el orden pasa a ser por columna. Lo que se lee de izquierda a derecha
 * en la primera línea es la 1.ª, la 4.ª y la 7.ª publicación, no las tres primeras. En un listado
 * cronológico —el home promete «de lo más reciente a lo más antiguo»— eso no es gratis; se aceptó
 * a cambio de quitar los huecos.
 *
 * **Los hijos se estilan desde aquí** (`[&>*]`) en vez de tocar cada tarjeta: los listados no son
 * homogéneos —unos ponen la tarjeta directamente dentro de un `<section>` y otros la envuelven en
 * un `<li>`—, así que el elemento que no debe partirse entre columnas es distinto en cada uno. El
 * contenedor sí sabe siempre cuál es: su hijo directo.
 *
 * `mb-4` y no `gap`: en multi-columna, `gap` separa **columnas**, no lo que va uno debajo de otro.
 */
const MASONRY_ITEM = "[&>*]:break-inside-avoid [&>*]:mb-4";

/**
 * Listados a ancho completo: home, búsqueda, categoría, productos, tienda y perfil.
 *
 * El número de columnas no vive aquí: lo decide `card-columns` (en `globals.css`) a partir del
 * ancho que tenga el listado —dos como mínimo, cuatro como máximo, las que quepan en medio—. Se
 * escribió como CSS con nombre y no como una clase suelta de Tailwind porque son tres declaraciones
 * y una frontera calculada: en una cadena de utilidades eso son cuatro números sin sitio donde
 * explicar de dónde salen.
 *
 * Antes decía `columns-[300px]`, sin tope ni suelo: daba una sola columna en el teléfono y tres en
 * escritorio, con tarjetas de 394px para un contenido que no llenaba la mitad del renglón.
 */
export const CARD_MASONRY = `card-columns gap-4 ${MASONRY_ITEM}`;

/**
 * La columna lateral de una ficha, que es la mitad de ancha.
 *
 * Con el ancho de columna del listado grande, «Publicaciones Relacionadas» caería a una sola tira
 * y dejaría de parecer un listado.
 */
export const CARD_MASONRY_NARROW = `columns-[240px] gap-4 ${MASONRY_ITEM}`;
