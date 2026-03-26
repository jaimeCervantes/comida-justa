import { ISearchPostResultDTO } from "../dtos/ISearchPostResultDTO";

export interface ISearchPostRepository {
  search(
    query: string,
    page: number,
    pageSize: number,
    locale?: string
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;
}
