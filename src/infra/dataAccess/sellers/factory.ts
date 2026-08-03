import { PostgresOrphanPostRepository } from "./PostgresOrphanPostRepository";
import { PostgresSellerRepository } from "./PostgresSellerRepository";

let instance: PostgresSellerRepository | null = null;

export function createSellerRepository(): PostgresSellerRepository {
  if (instance) return instance;
  instance = new PostgresSellerRepository();
  return instance;
}

let orphanInstance: PostgresOrphanPostRepository | null = null;

export function createOrphanPostRepository(): PostgresOrphanPostRepository {
  if (orphanInstance) return orphanInstance;
  orphanInstance = new PostgresOrphanPostRepository();
  return orphanInstance;
}
