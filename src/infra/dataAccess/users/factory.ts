import type { IUserRepository } from "./IUserRepository";
import { PostgresUserRepository } from "./PostgresUserRepository";

let instance: IUserRepository | null = null;

export function createUserRepository(): IUserRepository {
  if (instance) return instance;
  instance = new PostgresUserRepository();
  return instance;
}
