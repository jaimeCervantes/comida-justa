import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { ISearchPostResultDTO } from "../dtos/ISearchPostResultDTO";

export interface ISearchPostRepository {
  search(
    query: string,
    page: number,
    pageSize: number,
    locale?: string,
    near?: Coordinates | null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;
}
