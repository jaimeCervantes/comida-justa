import type { ISearchPostDTO } from "./dtos/ISearchPostDTO";
import type { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "./ports/ISearchPostRepository";

export class SearchPostsUseCase {
  constructor(private readonly postRepository: ISearchPostRepository) {}

  async execute(
    dto: ISearchPostDTO,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    if (!dto.query) {
      return { results: [], total: 0 };
    }

    return this.postRepository.search(
      dto.query,
      dto.page,
      dto.pageSize,
      dto.locale,
      dto.near ?? null,
    );
  }
}
