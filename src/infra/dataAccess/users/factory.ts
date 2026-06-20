import type { IUserRepository } from "./IUserRepository";
import { PostgresUserRepository } from "./PostgresUserRepository";
import { FirebaseUserRepository } from "./FirebaseUserRepository";

let instance: IUserRepository | null = null;

export function createUserRepository(): IUserRepository {
  if (instance) return instance;

  instance =
    process.env.DB_PROVIDER === "postgres"
      ? new PostgresUserRepository()
      : new FirebaseUserRepository();

  return instance;
}
