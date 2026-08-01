import { PostgresPostAdminRepository } from "./PostgresPostAdminRepository";

let instance: PostgresPostAdminRepository | null = null;

export function createPostAdminRepository(): PostgresPostAdminRepository {
  if (instance) return instance;
  instance = new PostgresPostAdminRepository();
  return instance;
}
