import ConsoleSearchReporter from "~/infra/services/ConsoleSearchReporter";
import type { ISearchPostRepository } from "~/use_cases/searchPosts/ports/ISearchPostRepository";
import type ISearchReporter from "~/use_cases/searchPosts/ports/ISearchReporter";
import { PostgresSearchPostRepository } from "./PostgresSearchPostRepository";
import PostgresSearchReporter from "./PostgresSearchReporter";

let instance: ISearchPostRepository | null = null;
let reporter: ISearchReporter | null = null;

export function createSearchPostRepository(): ISearchPostRepository {
  if (instance) return instance;
  instance = new PostgresSearchPostRepository();
  return instance;
}

/**
 * A dónde va la medición de cada búsqueda.
 *
 * Desde la migración Alembic `0029_2026_08_08` es la tabla `searches` y ya no el registro del
 * servidor, que solo se podía leer con un `grep` sobre archivos que rotan.
 *
 * **`SEARCH_REPORTER=console` la devuelve al registro, y la e2e lo usa.** No es una preferencia:
 * `searches` contesta «qué busca la gente y cuánta se va con las manos vacías», y una corrida de
 * la suite le mete decenas de términos inventados más `pan`, `panela` o `buñuelos`, que son
 * indistinguibles de una búsqueda real. El barrido de `testData.ts` no puede limpiarlos después
 * porque no hay prefijo que los marque, así que la única forma de no ensuciar el dato es no
 * escribirlo. Lo pone `playwright.config.ts`.
 */
export function createSearchReporter(): ISearchReporter {
  if (reporter) return reporter;
  reporter =
    process.env.SEARCH_REPORTER === "console"
      ? new ConsoleSearchReporter()
      : new PostgresSearchReporter();
  return reporter;
}
