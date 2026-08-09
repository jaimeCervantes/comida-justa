/**
 * El aspecto de un desplegable de Radix: el panel, sus filas y sus separadores.
 *
 * Vivía escrito a mano dentro de `UserMenu`. Al nacer el segundo desplegable —el de compartir— la
 * opción era copiar las tres cadenas o ponerlas donde las vean los dos. Copiarlas garantiza que el
 * día que una cambie, el otro menú se quede con el aspecto viejo, y esa diferencia no se ve hasta
 * que los dos están abiertos en la misma pantalla.
 *
 * Son solo clases: no saben qué cuelga de ellas, así que pueden vivir en el sistema de diseño.
 */
export const MENU_CONTENT_CLASS =
  "z-9999 min-w-[220px] rounded-[10px] border border-gray-200 bg-white p-2 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] dark:border-gray-800 dark:bg-gray-900";

export const MENU_ITEM_CLASS =
  "block w-full select-none rounded-[6px] px-3 py-2 text-[15px] leading-none text-gray-700 dark:text-gray-200 no-underline outline-hidden transition-colors data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800 data-[highlighted]:text-pw-green cursor-pointer";

export const MENU_SEPARATOR_CLASS = "my-1 h-px bg-gray-200 dark:bg-gray-800";
