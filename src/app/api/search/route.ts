import type { NextRequest } from "next/server";
import { createSearchPostRepository } from "~/infra/dataAccess/searchPosts/factory";
import { SearchPostsUseCase } from "~/use_cases/searchPosts/SearchPostsUseCase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const locale = searchParams.get("locale") || "es";

  const repository = createSearchPostRepository();
  const useCase = new SearchPostsUseCase(repository);

  const { results, total } = await useCase.execute({
    query: q,
    page: page,
    pageSize: limit,
    locale,
  });

  return Response.json({ results, total });
}
