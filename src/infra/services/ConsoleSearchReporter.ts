import type { SearchEvent } from "~/domain/search/searchEvent";
import type ISearchReporter from "~/use_cases/searchPosts/ports/ISearchReporter";

/**
 * Escribe cada búsqueda en el registro del servidor, en una línea que se puede filtrar y contar.
 *
 * El destino natural sería una tabla, pero crearla es una migración Alembic sobre la base
 * compartida —una acción irreversible que se dejó como decisión del equipo—. Mientras tanto esto da
 * el dato que hoy no existe: `grep '[search]' | grep emptyHanded=true` ya responde «qué se busca
 * que no encontramos».
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
