import type { IUserRepository } from "./IUserRepository";
import { PostgresUserProfileRepository } from "./PostgresUserProfileRepository";
import { PostgresUserRepository } from "./PostgresUserRepository";

let instance: IUserRepository | null = null;

export function createUserRepository(): IUserRepository {
  if (instance) return instance;
  instance = new PostgresUserRepository();
  return instance;
}

let profileInstance: PostgresUserProfileRepository | null = null;

export function createUserProfileRepository(): PostgresUserProfileRepository {
  if (profileInstance) return profileInstance;
  profileInstance = new PostgresUserProfileRepository();
  return profileInstance;
}
