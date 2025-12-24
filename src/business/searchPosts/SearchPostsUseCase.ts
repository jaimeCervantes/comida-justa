import { ISearchPostDTO } from "./dtos/ISearchPostDTO";
import { ISearchPostRepository } from "./ports/ISearchPostRepository";
import { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";

export class SearchPostsUseCase {
  constructor(private readonly postRepository: ISearchPostRepository) {}

  async execute(
    dto: ISearchPostDTO
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
    if (!dto.query) {
      return { results: [], total: 0 };
    }

    return this.postRepository.search(
      dto.query,
      dto.page,
      dto.pageSize,
      dto.locale
    );
  }
}
