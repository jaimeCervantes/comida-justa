/**
 * El término de búsqueda tal y como lo escribió quien busca.
 *
 * Next entrega el segmento dinámico **codificado**, así que `/buscar/buñuelos` llega como
 * `bu%C3%B1uelos`. La página lo decodificaba para pintarlo en el encabezado pero se lo pasaba
 * **crudo** a la consulta, de modo que cualquier término con acento o `ñ` buscaba una cadena con
 * signos de porcentaje y devolvía cero resultados. Y como el encabezado sí mostraba la palabra
 * bien, el fallo se leía como «no hay resultados» en vez de como un error.
 *
 * `decodeURIComponent` **lanza** con una secuencia inválida —un `%` suelto, que alguien puede
 * escribir perfectamente al buscar «50% descuento»—, así que aquí se devuelve el texto tal cual en
 * ese caso: buscar de más es mejor que romper la página.
 */
export function decodeSearchTerm(term: string | undefined | null): string {
  if (!term) return "";

  try {
    return decodeURIComponent(term);
  } catch {
    return term;
  }
}
