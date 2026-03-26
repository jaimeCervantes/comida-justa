import { SearchPostsUseCase } from "./SearchPostsUseCase";
import { ISearchPostRepository } from "./ports/ISearchPostRepository";
import { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";
import { vi, describe, it, expect, beforeEach, Mocked } from "vitest";

describe("SearchPostsUseCase", () => {
  let useCase: SearchPostsUseCase;
  let mockRepository: Mocked<ISearchPostRepository>;

  beforeEach(() => {
    mockRepository = {
      search: vi.fn(),
    };
    useCase = new SearchPostsUseCase(mockRepository);
  });

  it("should return empty results if query is empty", async () => {
    const result = await useCase.execute({ query: "", page: 1, pageSize: 10 });
    expect(result).toEqual({ results: [], total: 0 });
    expect(mockRepository.search).not.toHaveBeenCalled();
  });

  it("should call repository search with correct parameters", async () => {
    const mockResults: ISearchPostResultDTO[] = [
      {
        id: "1",
        title: "Test Post",
        content: "Content",
        slug: "test-post",
        media: { url: "", type: "image" },
        user: { id: "u1" },
        createdAt: new Date(),
        contactInfo: { phone: "123" },
      },
    ];
    mockRepository.search.mockResolvedValue({ results: mockResults, total: 1 });

    const result = await useCase.execute({
      query: "test",
      page: 1,
      pageSize: 10,
    });

    expect(mockRepository.search).toHaveBeenCalledWith(
      "test",
      1,
      10,
      undefined,
    );
    expect(result).toEqual({ results: mockResults, total: 1 });
  });
});
