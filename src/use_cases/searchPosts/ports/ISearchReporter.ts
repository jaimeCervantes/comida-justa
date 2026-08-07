import type { SearchEvent } from "~/domain/search/searchEvent";

/**
 * A dónde va lo que se mide de cada búsqueda.
 *
 * Es un puerto y no una llamada a `console.log` directa porque el destino va a cambiar: hoy es el
 * registro del servidor —una tabla exigiría una migración Alembic sobre la base compartida, que es
 * una decisión aparte— y mañana puede ser esa tabla sin tocar el caso de uso.
 *
 * **Nunca lanza.** Medir no puede romper la búsqueda: si el destino falla, quien buscaba tiene que
 * recibir sus resultados igual.
 */
export default interface ISearchReporter {
  record(event: SearchEvent): void;
}
