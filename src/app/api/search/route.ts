import type { NextRequest } from "next/server";
import { resolveLocale } from "~/i18n/routing";
import {
  createSearchPostRepository,
  createSearchReporter,
} from "~/infra/dataAccess/searchPosts/factory";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import { createEmbeddingService } from "~/infra/services/factory";
import { SearchPostsUseCase } from "~/use_cases/searchPosts/SearchPostsUseCase";

/**
 * El autocompletado de `SearchBar`, que es el único cliente que queda de esta ruta.
 *
 * Las dos páginas de `/buscar` llamaban aquí por `fetch` desde el servidor —un viaje HTTP para
 * hablar consigo mismo, y sin cookies—; ahora usan el caso de uso directamente (ver
 * `app/[locale]/buscar/data.ts`). Aquí la petición la hace el navegador, así que las cookies sí
 * viajan y `readVisitorLocation()` puede contestar.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  /* `resolveLocale` y no `|| "es"`: el parámetro llega de la barra de direcciones y un `?locale=fr`
     entraba tal cual en la consulta, donde ningún diccionario le corresponde. Aquí cae al español,
     que es lo mismo que hace cualquier ruta con un segmento de idioma desconocido. */
  const locale = resolveLocale(searchParams.get("locale") ?? undefined);

  const repository = createSearchPostRepository();
  const useCase = new SearchPostsUseCase(
    repository,
    createEmbeddingService(),
    createSearchReporter(),
  );

  const { results, total } = await useCase.execute({
    query: q,
    page: page,
    pageSize: limit,
    locale,
    near: await readVisitorLocation(),
  });

  return Response.json({ results, total });
}
