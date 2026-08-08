import type { SearchEvent } from "~/domain/search/searchEvent";
import type ISearchReporter from "~/use_cases/searchPosts/ports/ISearchReporter";

/**
 * Escribe cada búsqueda en el registro del servidor, en una línea que se puede filtrar y contar.
 *
 * **Ya no es el destino por defecto**: desde la migración Alembic `0029_2026_08_08` existe la tabla
 * `searches` y la fábrica devuelve `PostgresSearchReporter`. Esto se queda por dos motivos que
 * siguen valiendo: un entorno sin base —o un script— puede medir igual, y durante un incidente un
 * `grep '[search]'` sigue siendo más rápido que abrir un cliente de SQL.
 *
 * El formato es `clave=valor` a propósito: se lee de un vistazo y lo parsea cualquier agregador sin
 * necesidad de un esquema.
 */
export default class ConsoleSearchReporter implements ISearchReporter {
  record(event: SearchEvent): void {
    // Un fallo midiendo no puede tumbar una búsqueda.
    try {
      console.info(
        `[search] term=${JSON.stringify(event.term)} locale=${event.locale} strategy=${event.strategy} results=${event.resultCount} emptyHanded=${event.emptyHanded}`,
      );
    } catch {
      /* medir es lo primero que se sacrifica */
    }
  }
}
