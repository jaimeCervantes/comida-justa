import { NextRequest } from "next/server";
import { SearchPostsUseCase } from "~/business/searchPosts/SearchPostsUseCase";
import { FirebaseSearchPostRepository } from "~/infrastructure/dataAccess/searchPosts/FirebaseSearchPostRepository";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const locale = searchParams.get("locale") || "es";

  const repository = new FirebaseSearchPostRepository();
  const useCase = new SearchPostsUseCase(repository);

  const { results, total } = await useCase.execute({
    query: q,
    page: page,
    pageSize: limit,
    locale,
  });

  return Response.json({ results, total });
}
