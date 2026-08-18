import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  parsePublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { routing } from "~/i18n/routing";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { categoryKeysForActivePublicationPillar } from "~/infra/dataAccess/posts/publicationPillarFilter";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

/** El scroll infinito manda el idioma para que la página 2 no vuelva al español. */
function getLocale(request: Request): string {
  const requested = new URL(request.url).searchParams.get("locale");

  return requested && (routing.locales as readonly string[]).includes(requested)
    ? requested
    : routing.defaultLocale;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pagination: string[] }> },
) {
  const { pagination } = await params;
  const { page, pageSize } = getSlugParams(pagination);

  try {
    const postRepo = createPostQueryRepository();
    const currentPillar = parsePublicationPillar(
      new URL(request.url).searchParams.get(PUBLICATION_PILLAR_QUERY_PARAM),
    );

    // La misma ubicación que usó el primer render: si la página 2 llegara sin ella, las tarjetas
    // perderían la distancia a medio scroll y parecería que el dato se agota.
    const result = await postRepo.getMultiplePosts(
      page,
      pageSize,
      await readVisitorLocation(),
      {
        categoryKeys:
          await categoryKeysForActivePublicationPillar(currentPillar),
      },
    );

    const posts = await mapPostsToCardsForLocale(
      result.posts,
      getLocale(request),
    );
    const json: string = JSON.stringify({
      posts: posts,
      nextPage: result.nextPage,
      prevPage: result.prevPage,
      total: result.total,
    });

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    const json: string = JSON.stringify({
      error: "Error al cargar publicaciones",
    });
    return new Response(json, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

function getSlugParams(slugParams: string[]) {
  let page = PAGINATION_INIT_PAGE;
  let pageSize = PAGINATION_PAGE_SIZE;

  for (let i = 0; i < slugParams.length; i += 2) {
    const key = slugParams[i];
    const value = slugParams[i + 1];

    if (key === "page" && value) {
      page = parseInt(value, 10);
    } else if (key === "pageSize" && value) {
      pageSize = parseInt(value, 10);
    }
  }
  return { page, pageSize };
}
