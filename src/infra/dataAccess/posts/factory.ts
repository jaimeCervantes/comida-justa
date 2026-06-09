import type { IPostQueryRepository } from "./IPostQueryRepository";
import { PostgresPostQueryRepository } from "./PostgresPostQueryRepository";
import { FirestorePostQueryRepository } from "./FirestorePostQueryRepository";

let instance: IPostQueryRepository | null = null;

export function createPostQueryRepository(): IPostQueryRepository {
  if (instance) return instance;

  instance =
    process.env.DB_PROVIDER === "postgres"
      ? new PostgresPostQueryRepository()
      : new FirestorePostQueryRepository();

  return instance;
}
