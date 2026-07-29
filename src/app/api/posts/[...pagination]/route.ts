import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { mapPostsToCards } from "~/infra/UI/mappers/posts/mapPostsToCards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pagination: string[] }> },
) {
  const { pagination } = await params;
  const { page, pageSize } = getSlugParams(pagination);

  try {
    const postRepo = createPostQueryRepository();

    const result = await postRepo.getMultiplePosts(page, pageSize);

    const posts = mapPostsToCards(result.posts);
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
