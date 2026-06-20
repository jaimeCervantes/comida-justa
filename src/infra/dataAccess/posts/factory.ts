import type { IPostQueryRepository } from "./IPostQueryRepository";
import { PostgresPostQueryRepository } from "./PostgresPostQueryRepository";

let instance: IPostQueryRepository | null = null;

export function createPostQueryRepository(): IPostQueryRepository {
  if (instance) return instance;
  instance = new PostgresPostQueryRepository();
  return instance;
}
