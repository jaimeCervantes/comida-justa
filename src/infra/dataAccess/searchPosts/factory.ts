import type { ISearchPostRepository } from "~/use_cases/searchPosts/ports/ISearchPostRepository";
import { PostgresSearchPostRepository } from "./PostgresSearchPostRepository";

let instance: ISearchPostRepository | null = null;

export function createSearchPostRepository(): ISearchPostRepository {
  if (instance) return instance;
  instance = new PostgresSearchPostRepository();
  return instance;
}
