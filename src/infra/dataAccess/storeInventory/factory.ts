import { PostgresStoreInventoryRepository } from "./PostgresStoreInventoryRepository";

let instance: PostgresStoreInventoryRepository | null = null;

export function createStoreInventoryRepository(): PostgresStoreInventoryRepository {
  if (instance) return instance;
  instance = new PostgresStoreInventoryRepository();
  return instance;
}
