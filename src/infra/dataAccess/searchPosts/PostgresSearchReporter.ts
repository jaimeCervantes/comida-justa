import type { SearchEvent } from "~/domain/search/searchEvent";
import { db } from "~/infra/dataAccess/db/connection";
import { searches } from "~/infra/dataAccess/db/schema/searches";
import type ISearchReporter from "~/use_cases/searchPosts/ports/ISearchReporter";

/**
 * Deja cada búsqueda en la tabla `searches` (migración Alembic `0029_2026_08_08`).
 *
 * Sustituye a `ConsoleSearchReporter`, que era lo que se podía hacer sin tocar la base: responder
 * «qué se busca que no encontramos» era un `grep` sobre registros que rotan, así que la pregunta
 * solo se podía contestar sobre los últimos días y nunca sumando.
 *
 * **No se espera a que termine.** `ISearchReporter.record` devuelve `void` a propósito: medir va
 * después de tener la respuesta y no puede añadirle un viaje a la base al tiempo que espera quien
 * buscó. La escritura se lanza y se olvida; el `catch` está para que un rechazo no se convierta en
 * un `unhandledRejection` que tumbe el proceso.
 *
 * `empty_handed` no se escribe: es una columna generada. Que la calcule la base es lo que impide
 * que dos adaptadores acaben discrepando sobre qué cuenta como irse con las manos vacías.
 */
export default class PostgresSearchReporter implements ISearchReporter {
  record(event: SearchEvent): void {
    try {
      void db
        .insert(searches)
        .values({
          term: event.term,
          locale: event.locale,
          strategy: event.strategy,
          resultCount: event.resultCount,
        })
        .catch((error: unknown) => {
          console.warn("[search] no se pudo registrar la búsqueda", error);
        });
    } catch (error) {
      /* Un fallo síncrono al construir la sentencia tampoco puede tumbar una búsqueda. */
      console.warn("[search] no se pudo registrar la búsqueda", error);
    }
  }
}
