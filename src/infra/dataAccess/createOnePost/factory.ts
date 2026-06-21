import type IPostRepository from "~/use_cases/createOnePost/ports/IPostRepository";
import PostgresPostRepository from "./PostgresPostRepository";

let instance: IPostRepository | null = null;

export function createPostRepository(): IPostRepository {
  if (instance) return instance;
  instance = new PostgresPostRepository();
  return instance;
}
